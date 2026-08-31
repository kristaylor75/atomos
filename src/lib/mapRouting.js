// Simple great-circle distance in meters between two [lat, lng] points.
export function haversineDistance([lat1, lng1], [lat2, lng2]) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Fetches a driving route between two [lat, lng] points via the public OSRM demo server.
// Returns { coords: [[lat,lng], ...], distance, duration } or null if no route was found.
export async function fetchRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) return null;
  const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  return { coords, distance: data.routes[0].distance, duration: data.routes[0].duration };
}

// Fetches a driving route through an ordered sequence of 3+ [lat, lng] points (a trip/waypoint route).
// Returns { coords: [[lat,lng], ...], distance, duration } or null if no route was found.
export async function fetchMultiRoute(points) {
  const path = points.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) return null;
  const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  return { coords, distance: data.routes[0].distance, duration: data.routes[0].duration };
}