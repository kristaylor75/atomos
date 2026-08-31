// Checks the last known weather location for severe conditions (now or in the
// next few days) and returns simple alert objects for the notification bell.
const LOCATION_KEY = 'weatherWidgetLocation';

const SEVERE_LABELS = {
  65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain',
  75: 'Heavy snow', 82: 'Violent rain showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Severe thunderstorm with hail',
};

export async function getWeatherAlerts() {
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(LOCATION_KEY)); } catch { /* no saved location yet */ }
  if (!stored) return [];
  const { lat, lon, label } = stored;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=weather_code&daily=weather_code,time&forecast_days=3&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const alerts = [];
    const place = label || 'your location';

    if (data.current && SEVERE_LABELS[data.current.weather_code]) {
      alerts.push({
        id: `weather-now-${lat}-${lon}`,
        message: `${SEVERE_LABELS[data.current.weather_code]} now near ${place}`,
        to: '/weather',
      });
    }

    data.daily?.time?.forEach((d, i) => {
      const code = data.daily.weather_code[i];
      if (i === 0 || !SEVERE_LABELS[code]) return; // today is covered by "current" above
      const dateStr = new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      alerts.push({
        id: `weather-day-${d}-${lat}-${lon}`,
        message: `${SEVERE_LABELS[code]} forecast ${dateStr} near ${place}`,
        to: '/weather',
      });
    });

    return alerts;
  } catch {
    return []; // offline — skip alerts rather than breaking notifications
  }
}