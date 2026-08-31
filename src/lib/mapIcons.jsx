import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import { MapPin, Star, Flag, Home, Heart, Utensils, Fuel, Tent, AlertTriangle, Coffee, StickyNote } from 'lucide-react';

export const WAYPOINT_ICONS = [
  { value: 'pin', Icon: MapPin, labelKey: 'mapIconPin' },
  { value: 'star', Icon: Star, labelKey: 'mapIconStar' },
  { value: 'flag', Icon: Flag, labelKey: 'mapIconFlag' },
  { value: 'home', Icon: Home, labelKey: 'mapIconHome' },
  { value: 'heart', Icon: Heart, labelKey: 'mapIconHeart' },
  { value: 'food', Icon: Utensils, labelKey: 'mapIconFood' },
  { value: 'fuel', Icon: Fuel, labelKey: 'mapIconFuel' },
  { value: 'camp', Icon: Tent, labelKey: 'mapIconCamp' },
  { value: 'hazard', Icon: AlertTriangle, labelKey: 'mapIconHazard' },
  { value: 'coffee', Icon: Coffee, labelKey: 'mapIconCoffee' },
];

export function getWaypointIconDef(value) {
  return WAYPOINT_ICONS.find((i) => i.value === value) || WAYPOINT_ICONS[0];
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function buildWaypointDivIcon(iconValue, hasNote, label) {
  const { Icon } = getWaypointIconDef(iconValue);
  const iconSvg = renderToStaticMarkup(<Icon size={16} color="white" strokeWidth={2.5} />);
  const badgeSvg = hasNote ? renderToStaticMarkup(<StickyNote size={10} color="white" strokeWidth={3} />) : '';
  const labelHtml = label ? `
    <div style="position:absolute;top:36px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:10px;font-weight:600;line-height:1.2;padding:1px 6px;border-radius:4px;background:hsl(var(--card) / 0.92);color:hsl(var(--foreground));border:1px solid hsl(var(--border));pointer-events:none;">
      ${escapeHtml(label)}
    </div>` : '';
  const html = `
    <div style="position:relative;width:32px;height:32px;">
      <div style="width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:hsl(var(--primary));display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.5);border:2px solid hsl(var(--card));">
        <div style="transform:rotate(45deg);">${iconSvg}</div>
      </div>
      ${hasNote ? `<div style="position:absolute;top:-4px;right:-4px;width:16px;height:16px;border-radius:50%;background:hsl(38 92% 60%);display:flex;align-items:center;justify-content:center;border:1.5px solid hsl(var(--card));">${badgeSvg}</div>` : ''}
      ${labelHtml}
    </div>
  `;
  return L.divIcon({ html, className: '', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -30] });
}

export function buildUserLocationDivIcon() {
  const html = `<div style="width:18px;height:18px;border-radius:50%;background:hsl(var(--primary));border:3px solid hsl(var(--card));box-shadow:0 0 0 4px hsl(var(--primary) / 0.3), 0 2px 6px rgba(0,0,0,0.4);"></div>`;
  return L.divIcon({ html, className: '', iconSize: [18, 18], iconAnchor: [9, 9] });
}