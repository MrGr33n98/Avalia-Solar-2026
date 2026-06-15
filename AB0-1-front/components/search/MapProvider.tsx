'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle } from 'react-leaflet';
import type { LatLngBounds } from 'leaflet';

export interface MapCompany {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  ratingAvg?: number;
  isSponsored?: boolean;
  city?: string;
  state?: string;
  logo_url?: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MapProviderProps {
  companies: MapCompany[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onBoundsChanged?: (bounds: MapBounds) => void;
  onMarkerClick?: (company: MapCompany) => void;
  selectedCompanyId?: string;
  className?: string;
  radiusKm?: number;
}

// Componente interno que captura eventos do mapa
function BoundsWatcher({ onBoundsChanged }: { onBoundsChanged?: (bounds: MapBounds) => void }) {
  const map = useMapEvents({
    moveend: () => {
      if (!onBoundsChanged) return;
      const b: LatLngBounds = map.getBounds();
      onBoundsChanged({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    },
  });
  return null;
}

export default function MapProvider({
  companies,
  center = { lat: -15.7801, lng: -47.9292 }, // Brasília como padrão
  zoom = 6,
  onBoundsChanged,
  onMarkerClick,
  selectedCompanyId,
  className = 'w-full h-full',
  radiusKm,
}: MapProviderProps) {
  const [L, setL] = useState<typeof import('leaflet') | null>(null);

  // Leaflet precisa ser importado no client-side (SSR incompatível)
  useEffect(() => {
    import('leaflet').then((leaflet) => {
      // Fix ícones padrão do Leaflet em Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setL(leaflet);
    });
  }, []);

  if (!L) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-500">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  // Ícone personalizado para empresa patrocinada
  const sponsoredIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    className: 'leaflet-marker-sponsored',
  });

  const defaultIcon = new L.Icon.Default();

  const getCompanyIcon = (company: MapCompany) => {
    if (company.logo_url) {
      return new L.divIcon({
        className: 'custom-avatar-marker',
        html: `<div style="width: 32px; height: 32px; border-radius: 50%; overflow: hidden; border: 2px solid ${company.isSponsored ? '#3b82f6' : '#ffffff'}; box-shadow: 0 2px 4px rgba(0,0,0,0.2); background: white; display: flex; align-items: center; justify-content: center;">
                 <img src="${company.logo_url}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });
    }
    return company.isSponsored ? sponsoredIcon : defaultIcon;
  };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      className={className}
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <BoundsWatcher onBoundsChanged={onBoundsChanged} />
      
      {center && radiusKm && (
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusKm * 1000}
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }}
        />
      )}

      {companies.map((company) => (
        <Marker
          key={company.id}
          position={[company.latitude, company.longitude]}
          icon={getCompanyIcon(company)}
          eventHandlers={{
            click: () => onMarkerClick?.(company),
          }}
        >
          <Popup>
            <div className="min-w-[160px]">
              <p className="font-semibold text-slate-900 leading-tight">{company.name}</p>
              {company.city && (
                <p className="text-xs text-slate-500 mt-0.5">{company.city} · {company.state}</p>
              )}
              {company.ratingAvg != null && (
                <p className="text-xs text-amber-600 mt-0.5">★ {company.ratingAvg.toFixed(1)}</p>
              )}
              <a
                href={`/companies/${company.slug}`}
                className="block mt-2 text-xs font-semibold text-blue-600 hover:underline"
              >
                Ver perfil →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
