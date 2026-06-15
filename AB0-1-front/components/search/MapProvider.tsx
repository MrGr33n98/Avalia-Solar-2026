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
    const borderColor = company.isSponsored ? '#3b82f6' : '#ffffff';
    const bgColor = company.isSponsored ? '#eff6ff' : '#f8fafc';
    const textColor = company.isSponsored ? '#3b82f6' : '#64748b';
    const initial = company.name ? company.name.charAt(0).toUpperCase() : 'E';

    const innerHtml = company.logo_url
      ? `<img src="${company.logo_url}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
         <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: ${bgColor}; color: ${textColor}; font-weight: bold; font-family: system-ui, sans-serif; font-size: 16px;">${initial}</div>`
      : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${bgColor}; color: ${textColor}; font-weight: bold; font-family: system-ui, sans-serif; font-size: 16px;">${initial}</div>`;

    return L.divIcon({
      className: 'custom-avatar-marker hover:-translate-y-1 transition-transform duration-200',
      html: `<div style="position: relative; width: 36px; height: 36px;">
               <div style="position: absolute; z-index: 2; width: 36px; height: 36px; border-radius: 50%; overflow: hidden; border: 2px solid ${borderColor}; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); background: white; display: flex; align-items: center; justify-content: center;">
                 ${innerHtml}
               </div>
               <div style="position: absolute; z-index: 1; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${borderColor}; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));"></div>
             </div>`,
      iconSize: [36, 44],
      iconAnchor: [18, 44],
      popupAnchor: [0, -44],
    });
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
              {company.ratingAvg != null && !isNaN(Number(company.ratingAvg)) && (
                <p className="text-xs text-amber-600 mt-0.5">★ {Number(company.ratingAvg).toFixed(1)}</p>
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
