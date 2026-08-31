import { Marker, Circle } from 'react-leaflet';
import { buildUserLocationDivIcon } from '@/lib/mapIcons.jsx';
import { usePrimaryColor } from '@/hooks/useThemeColor';

export default function UserLocationMarker({ position, accuracy }) {
  const color = usePrimaryColor();
  if (!position) return null;
  return (
    <>
      {accuracy && (
        <Circle
          center={position}
          radius={accuracy}
          pathOptions={{ color, fillColor: color, fillOpacity: 0.12, weight: 1 }}
        />
      )}
      <Marker position={position} icon={buildUserLocationDivIcon()} />
    </>
  );
}