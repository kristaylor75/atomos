import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Locate } from 'lucide-react';
// import { appData } from "@/api/localClient";
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { addHistoryEntry } from '@/lib/history';
import { buildWaypointDivIcon } from '@/lib/mapIcons.jsx';
import { fetchRoute, haversineDistance } from '@/lib/mapRouting';
import { usePrimaryColor } from '@/hooks/useThemeColor';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import ClickHandler from '@/components/map/ClickHandler';
import UserLocationMarker from '@/components/map/UserLocationMarker';
import MapSearchBar from '@/components/map/MapSearchBar';
import WaypointCreateForm from '@/components/map/WaypointCreateForm';
import WaypointDetailPanel from '@/components/map/WaypointDetailPanel';
import WaypointList from '@/components/map/WaypointList';
import OfflineBanner from '@/components/map/OfflineBanner';
import ExportWaypoints from '@/components/map/ExportWaypoints';
import TripPlanner from '@/components/map/TripPlanner';

const DEFAULT_CENTER = [39.8283, -98.5795];
const ARRIVAL_METERS = 30;
const ROUTE_REFRESH_MS = 3000;
const WAYPOINTS_CACHE_KEY = 'map_waypoints_cache';

export default function MapEditor() {
  const { t } = useLanguage();
  const routeColor = usePrimaryColor();
  const isOnline = useOnlineStatus();
  const [waypoints, setWaypoints] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [locating, setLocating] = useState(true);
  const [pendingPoint, setPendingPoint] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null); // { waypointId, coords }
  const [tripRouteCoords, setTripRouteCoords] = useState(null);
  const mapRef = useRef(null);
  const hasCentered = useRef(false);
  const lastRouteFetch = useRef(0);

  const load = useCallback(async (user) => {
    try {
      const mine = await appData.entities.Waypoint.filter({ created_by_id: user.id }, '-created_date', 200);
      setWaypoints(mine);
      localStorage.setItem(WAYPOINTS_CACHE_KEY, JSON.stringify(mine));
    } catch (err) {
      // Offline or request failed — fall back to the last cached waypoints so the map isn't empty.
      const cached = localStorage.getItem(WAYPOINTS_CACHE_KEY);
      if (cached) setWaypoints(JSON.parse(cached));
    }
  }, []);

  useEffect(() => {
    (async () => {
      const user = await appData.auth.me();
      await load(user);
    })();
  }, [load]);

  // Cache map tiles for offline use.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/map-sw.js').catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setLocating(false); return; }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        setAccuracy(pos.coords.accuracy);
        setLocating(false);
        if (!hasCentered.current && mapRef.current) {
          mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 15);
          hasCentered.current = true;
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const addWaypoint = async (lat, lng, address) => {
    const created = await appData.entities.Waypoint.create({ label: t('mapDefaultLabel'), latitude: lat, longitude: lng, address: address || '', icon: 'pin' });
    setWaypoints((prev) => [...prev, created]);
  };

  const handleMapRightClick = (latlng) => setPendingPoint({ lat: latlng.lat, lng: latlng.lng });

  const handleCreateWaypoint = async ({ label, icon, note }) => {
    if (!pendingPoint) return;
    const created = await appData.entities.Waypoint.create({
      label, icon, note, latitude: pendingPoint.lat, longitude: pendingPoint.lng, address: '',
    });
    setWaypoints((prev) => [...prev, created]);
    setPendingPoint(null);
    addHistoryEntry({ tool: 'map', input: `${pendingPoint.lat.toFixed(4)}, ${pendingPoint.lng.toFixed(4)}`, result: label });
  };

  const handleSelectLocation = ({ lat, lng, address }) => {
    addWaypoint(lat, lng, address);
    addHistoryEntry({ tool: 'map', input: address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`, result: t('mapDefaultLabel') });
    mapRef.current?.setView([lat, lng], 15);
  };

  const handleSaveWaypoint = async (wp, updates) => {
    const updated = await appData.entities.Waypoint.update(wp.id, updates);
    setWaypoints((prev) => prev.map((w) => (w.id === wp.id ? updated : w)));
  };

  const handleDeleteWaypoint = async (id) => {
    await appData.entities.Waypoint.delete(id);
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (activeRoute?.waypointId === id) setActiveRoute(null);
  };

  const jumpTo = (wp) => mapRef.current?.setView([wp.latitude, wp.longitude], 16);
  const recenter = () => { if (userPosition) mapRef.current?.setView(userPosition, 15); };

  const startNavigation = async (wp) => {
    if (!userPosition) return;
    try {
      const route = await fetchRoute(userPosition, [wp.latitude, wp.longitude]);
      if (route) {
        setActiveRoute({ waypointId: wp.id, coords: route.coords });
        lastRouteFetch.current = Date.now();
      }
    } catch {
      // No internet — can't fetch a route right now.
    }
  };
  const stopNavigation = () => setActiveRoute(null);

  // Keep the route updated as the user moves, and auto-clear it on arrival.
  useEffect(() => {
    if (!activeRoute || !userPosition) return;
    const wp = waypoints.find((w) => w.id === activeRoute.waypointId);
    if (!wp) { setActiveRoute(null); return; }
    const distance = haversineDistance(userPosition, [wp.latitude, wp.longitude]);
    if (distance <= ARRIVAL_METERS) {
      setActiveRoute(null);
      return;
    }
    const now = Date.now();
    if (now - lastRouteFetch.current > ROUTE_REFRESH_MS) {
      lastRouteFetch.current = now;
      fetchRoute(userPosition, [wp.latitude, wp.longitude])
        .then((route) => { if (route) setActiveRoute({ waypointId: wp.id, coords: route.coords }); })
        .catch(() => {}); // offline — keep showing the last known route
    }
  }, [userPosition, activeRoute, waypoints]);

  const selectedWaypoint = waypoints.find((w) => w.id === selectedId);

  return (
    <div>
      {!isOnline && <OfflineBanner />}
      <MapSearchBar onSelectLocation={handleSelectLocation} />

      <TripPlanner
        waypoints={waypoints}
        onRouteComputed={(coords) => setTripRouteCoords(coords)}
        onClearRoute={() => setTripRouteCoords(null)}
      />

      {selectedWaypoint && (
        <WaypointDetailPanel
          waypoint={selectedWaypoint}
          onSave={(updates) => handleSaveWaypoint(selectedWaypoint, updates)}
          onDelete={() => handleDeleteWaypoint(selectedWaypoint.id)}
          onClose={() => setSelectedId(null)}
          onNavigate={() => startNavigation(selectedWaypoint)}
          onStopNavigate={stopNavigation}
          isNavigating={activeRoute?.waypointId === selectedWaypoint.id}
          canNavigate={!!userPosition && isOnline}
        />
      )}

      <div className="panel overflow-hidden mb-3 isolate relative" style={{ height: '60vh' }}>
        <MapContainer center={userPosition || DEFAULT_CENTER} zoom={userPosition ? 15 : 4} style={{ height: '100%', width: '100%' }} ref={mapRef}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onMapRightClick={handleMapRightClick} />
          <UserLocationMarker position={userPosition} accuracy={accuracy} />
          {activeRoute && (
            <Polyline positions={activeRoute.coords} pathOptions={{ color: routeColor, weight: 5, opacity: 0.85 }} />
          )}
          {tripRouteCoords && (
            <Polyline positions={tripRouteCoords} pathOptions={{ color: 'hsl(38, 92%, 50%)', weight: 5, opacity: 0.85, dashArray: '8 6' }} />
          )}
          {waypoints.map((wp) => (
            <Marker
              key={wp.id}
              position={[wp.latitude, wp.longitude]}
              icon={buildWaypointDivIcon(wp.icon, !!wp.note, wp.label)}
              eventHandlers={{ click: () => setSelectedId(wp.id) }}
            />
          ))}
          {pendingPoint && (
            <Popup
              position={[pendingPoint.lat, pendingPoint.lng]}
              eventHandlers={{ remove: () => setPendingPoint(null) }}
            >
              <WaypointCreateForm onCreate={handleCreateWaypoint} onCancel={() => setPendingPoint(null)} />
            </Popup>
          )}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('mapWaypointsTitle')}</span>
        <div className="flex items-center gap-1">
          <ExportWaypoints waypoints={waypoints} />
          <button
            onClick={recenter}
            disabled={!userPosition}
            className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg disabled:opacity-40"
            style={{ color: 'hsl(var(--primary))' }}
          >
            <Locate className="w-3.5 h-3.5" /> {locating ? t('mapLocating') : t('mapMyLocation')}
          </button>
        </div>
      </div>

      <div className="panel p-3">
        <WaypointList waypoints={waypoints} onJump={jumpTo} onDelete={handleDeleteWaypoint} />
      </div>

      <p className="text-[10px] text-center mt-2 opacity-50">{t('mapClickHint')}</p>
    </div>
  );
}