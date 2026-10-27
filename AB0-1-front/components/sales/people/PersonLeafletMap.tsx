'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface PersonLeafletMapProps {
  lat: number;
  lng: number;
  name: string;
  locationLabel: string;
  mapType?: 'streets' | 'satellite';
}

export default function PersonLeafletMap({
  lat,
  lng,
  name,
  locationLabel,
  mapType = 'streets',
}: PersonLeafletMapProps) {
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      // Fix default Leaflet marker icons in Next.js bundler
      const iconProto = leaflet.Icon.Default.prototype as unknown as { _getIconUrl?: () => string };
      delete iconProto._getIconUrl;

      leaflet.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setLeafletLoaded(true);
    });
  }, []);

  if (!leafletLoaded) {
    return (
      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tileUrl =
    mapType === 'satellite'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      className="w-full h-full z-0 filter saturate-95"
    >
      <TileLayer url={tileUrl} />
      <Marker position={[lat, lng]}>
        <Popup>
          <div className="text-xs font-sans p-1">
            <strong className="block text-slate-900 font-bold">{name}</strong>
            <span className="text-slate-500">{locationLabel}</span>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
