'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, useMap } from 'react-leaflet';
import type { LatLngBounds } from 'leaflet';
import { useTheme } from 'next-themes';
import { getFullImageUrl } from '@/utils/image';

// IMPORTAÇÃO CRÍTICA: Sem isso, o Leaflet renderiza de forma totalmente quebrada e os blocos de mapa ficam desalinhados.
import 'leaflet/dist/leaflet.css';

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

// Componente interno que atualiza a visão do mapa quando as props de centro ou zoom mudam
function ChangeMapView({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom, { animate: true });
  }, [center.lat, center.lng, zoom, map]);
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
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Garante a montagem do lado do cliente para evitar bugs de hidratação com useTheme
  useEffect(() => {
    setMounted(true);
    import('leaflet').then((leaflet) => {
      // Correção dos caminhos de ícone padrão do Leaflet
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

  if (!L || !mounted) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Carregando mapa premium...</p>
        </div>
      </div>
    );
  }

  // Verifica se o tema atual é dark (incluindo detecção de sistema)
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Provedores de Tiles do CartoDB: Visual moderno, vetorial-like e limpo
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const tileAttribution = '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  // Criação dos marcadores circulares de luxo estilizados
  const getCompanyIcon = (company: MapCompany) => {
    const logoUrl = getFullImageUrl(company.logo_url || undefined);
    const borderColor = company.isSponsored ? '#3b82f6' : (isDark ? '#475569' : '#cbd5e1');
    const bgColor = company.isSponsored ? '#eff6ff' : (isDark ? '#1e293b' : '#f8fafc');
    const textColor = company.isSponsored ? '#3b82f6' : (isDark ? '#94a3b8' : '#64748b');
    const initial = company.name ? company.name.charAt(0).toUpperCase() : 'E';

    const isSelected = selectedCompanyId === company.id;

    // Elemento HTML de imagem ou inicial de fallback
    const innerHtml = logoUrl
      ? `<img src="${logoUrl}" style="width: 100%; height: 100%; object-fit: contain; padding: 3px; border-radius: 50%; background-color: white;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
         <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: ${bgColor}; color: ${textColor}; font-weight: bold; font-family: system-ui, sans-serif; font-size: 13px; border-radius: 50%;">${initial}</div>`
      : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${bgColor}; color: ${textColor}; font-weight: bold; font-family: system-ui, sans-serif; font-size: 13px; border-radius: 50%;">${initial}</div>`;

    // Classes do Tailwind para dar comportamento interativo, sombras elegantes e pulsação em patrocinados
    const activeBorderClass = isSelected
      ? 'border-[3px] border-purple-600 scale-110 z-30 shadow-[0_0_15px_rgba(147,51,234,0.5)]'
      : (company.isSponsored
        ? 'border-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] hover:border-blue-600'
        : 'border-2 border-white dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:border-slate-300 dark:hover:border-slate-600');

    const pingEffect = company.isSponsored
      ? `<div style="position: absolute; z-index: 1; width: 34px; height: 34px; border-radius: 50%; background-color: rgba(59,130,246,0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
      : '';

    return L.divIcon({
      className: 'custom-avatar-marker-wrapper',
      html: `<div class="relative w-[42px] h-[42px] flex items-center justify-center transition-all duration-300 hover:scale-115 hover:-translate-y-1" style="pointer-events: auto;">
               ${pingEffect}
               <div class="relative z-10 w-[36px] h-[36px] rounded-full overflow-hidden bg-white dark:bg-slate-950 flex items-center justify-center transition-all duration-300 ${activeBorderClass}">
                 ${innerHtml}
               </div>
               <!-- Triângulo apontador na base do avatar -->
               <div class="absolute -bottom-0.5 z-0 w-2 h-2 rotate-45 border-r border-b bg-white dark:bg-slate-950 ${isSelected ? 'border-purple-600 bg-purple-600' : (company.isSponsored ? 'border-blue-500' : 'border-white dark:border-slate-800')}"></div>
             </div>`,
      iconSize: [42, 48],
      iconAnchor: [21, 42],
      popupAnchor: [0, -42],
    });
  };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      className={className}
      style={{ zIndex: 0 }}
      zoomControl={true}
    >
      <TileLayer
        attribution={tileAttribution}
        url={tileUrl}
      />
      <BoundsWatcher onBoundsChanged={onBoundsChanged} />
      <ChangeMapView center={center} zoom={zoom} />
      
      {center && radiusKm && (
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.08,
            weight: 1.5,
            dashArray: '5, 5',
          }}
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
          <Popup className="premium-popup">
            <div className="min-w-[170px] p-0.5 text-left">
              <p className="font-bold text-slate-900 dark:text-slate-900 leading-snug text-sm">{company.name}</p>
              {company.city && (
                <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5 font-medium">{company.city} · {company.state}</p>
              )}
              {company.ratingAvg != null && !isNaN(Number(company.ratingAvg)) && (
                <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-amber-600">
                  <span className="text-amber-500 text-xs">★</span>
                  <span>{Number(company.ratingAvg).toFixed(1)}</span>
                </div>
              )}
              <a
                href={`/companies/${company.slug}`}
                className="inline-flex items-center gap-0.5 mt-2.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Ver perfil da empresa <span className="text-[9px]">→</span>
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

