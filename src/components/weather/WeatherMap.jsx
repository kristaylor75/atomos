import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { buildUserLocationDivIcon } from '@/lib/mapIcons.jsx';

// RainViewer radar tiles show a "Zoom Level Not Supported" placeholder past this level.
const WEATHER_MAX_ZOOM = 7;

// Tile colors (including the storm overlay) automatically match the active
// app appearance via the global `.skin-*` CSS rules on `.leaflet-tile-pane`
// (see src/index.css).
export default function WeatherMap({ coords }) {
  const { t } = useLanguage();
  const [radarUrl, setRadarUrl] = useState(null);
  const [selected, setSelected] = useState(false);
  const mapRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then((r) => r.json())
      .then((data) => {
        const frames = data?.radar?.past;
        if (frames?.length) {
          const last = frames[frames.length - 1];
          setRadarUrl(`${data.host}${last.path}/256/{z}/{x}/{y}/2/1_1.png`);
        }
      })
      .catch(() => {}); // no internet — map still shows without the storm overlay
  }, []);

  // Only enable scroll-wheel zoom while this map is "selected" (clicked), so
  // scrolling the page doesn't get hijacked by the embedded map.
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setSelected(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (selected) map.scrollWheelZoom.enable();
    else map.scrollWheelZoom.disable();
  }, [selected]);

  if (!coords) return null;
  const position = [coords.lat, coords.lon];

  return (
    <div className="panel p-4 mt-3">
      <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {t('weatherMapTitle')}
      </span>
      <p className="text-[10px] mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('weatherMapStormHint')}</p>
      <div
        ref={wrapRef}
        onClick={() => setSelected(true)}
        className="overflow-hidden rounded-xl isolate relative"
        style={{ height: '220px', boxShadow: selected ? '0 0 0 2px hsl(var(--primary))' : 'none' }}
      >
        <MapContainer
          center={position}
          zoom={WEATHER_MAX_ZOOM}
          maxZoom={WEATHER_MAX_ZOOM}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          ref={mapRef}
        >
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={WEATHER_MAX_ZOOM} />
          {radarUrl && <TileLayer url={radarUrl} opacity={0.55} attribution="&copy; RainViewer" maxZoom={WEATHER_MAX_ZOOM} />}
          <Marker position={position} icon={buildUserLocationDivIcon()} />
        </MapContainer>
      </div>
    </div>
  );
}