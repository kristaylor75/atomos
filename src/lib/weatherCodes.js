// Shared WMO weather-code lookup (icon + translation key) used by both the
// full Weather station page and the home-screen WeatherWidget.
import { Cloud, CloudRain, CloudSnow, Sun, CloudFog } from 'lucide-react';

export const WMO_ICONS = {
  0: Sun, 1: Sun, 2: Cloud, 3: Cloud, 45: CloudFog, 48: CloudFog,
  51: CloudRain, 53: CloudRain, 55: CloudRain, 56: CloudRain, 57: CloudRain,
  61: CloudRain, 63: CloudRain, 65: CloudRain, 66: CloudRain, 67: CloudRain,
  71: CloudSnow, 73: CloudSnow, 75: CloudSnow, 77: CloudSnow,
  80: CloudRain, 81: CloudRain, 82: CloudRain, 85: CloudSnow, 86: CloudSnow,
  95: CloudRain, 96: CloudRain, 99: CloudRain,
};

export const WMO_KEYS = {
  0: 'weatherCond_clear', 1: 'weatherCond_mainlyClear', 2: 'weatherCond_partlyCloudy', 3: 'weatherCond_overcast',
  45: 'weatherCond_fog', 48: 'weatherCond_rimeFog',
  51: 'weatherCond_lightDrizzle', 53: 'weatherCond_drizzle', 55: 'weatherCond_heavyDrizzle',
  56: 'weatherCond_freezingDrizzle', 57: 'weatherCond_freezingDrizzle',
  61: 'weatherCond_lightRain', 63: 'weatherCond_rain', 65: 'weatherCond_heavyRain',
  66: 'weatherCond_freezingRain', 67: 'weatherCond_freezingRain',
  71: 'weatherCond_lightSnow', 73: 'weatherCond_snow', 75: 'weatherCond_heavySnow', 77: 'weatherCond_snowGrains',
  80: 'weatherCond_rainShowers', 81: 'weatherCond_rainShowers', 82: 'weatherCond_violentShowers',
  85: 'weatherCond_snowShowers', 86: 'weatherCond_snowShowers',
  95: 'weatherCond_thunderstorm', 96: 'weatherCond_thunderstorm', 99: 'weatherCond_thunderstorm',
};