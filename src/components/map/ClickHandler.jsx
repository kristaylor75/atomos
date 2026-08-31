import { useMapEvents } from 'react-leaflet';

export default function ClickHandler({ onMapRightClick }) {
  useMapEvents({
    contextmenu(e) {
      e.originalEvent.preventDefault();
      onMapRightClick(e.latlng);
    },
  });
  return null;
}