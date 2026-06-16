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
      ? `<img src="${logoUrl}" style="width: 100%; height: 100%; object-fit: contain; padding: 4px; border-radius: 50%; background-color: white;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
         <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: ${bgColor}; color: ${textColor}; font-weight: bold; font-family: system-ui, sans-serif; font-size: 16px; border-radius: 50%;">${initial}</div>`
      : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${bgColor}; color: ${textColor}; font-weight: bold; font-family: system-ui, sans-serif; font-size: 16px; border-radius: 50%;">${initial}</div>`;

    // Classes do Tailwind para dar comportamento interativo, sombras elegantes e pulsação em patrocinados
    const activeBorderClass = isSelected
      ? 'border-[3px] border-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.6)]'
      : (company.isSponsored
        ? 'border-2 border-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.4)] hover:border-blue-600'
        : 'border-[1.5px] border-slate-300 dark:border-slate-700 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:border-slate-400 dark:hover:border-slate-500');

    const pingEffect = company.isSponsored
      ? `<div style="position: absolute; z-index: 1; width: 44px; height: 44px; border-radius: 50%; background-color: rgba(59,130,246,0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
      : '';

    const avatarSize = isSelected ? 'w-[52px] h-[52px]' : 'w-[44px] h-[44px]';
    const wrapperSize = isSelected ? 'w-[58px] h-[58px] -translate-y-2' : 'w-[50px] h-[50px]';
    const pointerSize = isSelected ? 'w-3 h-3 -bottom-1.5' : 'w-2.5 h-2.5 -bottom-1';

    return L.divIcon({
      className: 'custom-avatar-marker-wrapper',
      html: `<div class="relative ${wrapperSize} flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-2" style="pointer-events: auto;">
               ${pingEffect}
               <div class="relative z-10 ${avatarSize} rounded-full overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center transition-all duration-300 ${activeBorderClass}">
                 ${innerHtml}
               </div>
               <!-- Triângulo apontador na base do avatar -->
               <div class="absolute ${pointerSize} z-0 rotate-45 border-r border-b bg-white dark:bg-slate-900 ${isSelected ? 'border-purple-600 bg-purple-600' : (company.isSponsored ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-700')}"></div>
             </div>`,
      iconSize: isSelected ? [58, 66] : [50, 56],
      iconAnchor: isSelected ? [29, 66] : [25, 56],
      popupAnchor: [0, -50],
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
          <Popup className="premium-popup" closeButton={false}>
            <div className="w-[260px] flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-800 p-4 relative">
              
              {/* Close Button simulado (o original do leaflet foi desativado) */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // Leaflet fechará automaticamente via trigger no mapa ou clicando fora,
                  // mas podemos adicionar uma classe que feche os popups se quisermos.
                  const closeBtn = document.querySelector('.leaflet-popup-close-button') as HTMLElement;
                  if (closeBtn) closeBtn.click();
                }}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors z-10"
              >
                ✕
              </button>

              <div className="flex gap-3 items-center mb-3 pr-4">
                <div className="w-12 h-12 shrink-0 rounded-full border border-slate-100 dark:border-slate-800 overflow-hidden bg-white flex items-center justify-center p-1 shadow-sm">
                  {company.logo_url ? (
                    <img src={getFullImageUrl(company.logo_url)} className="w-full h-full object-contain" alt={company.name} />
                  ) : (
                    <span className="font-extrabold text-slate-400 text-lg">{company.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight truncate" title={company.name}>{company.name}</h3>
                  {company.city && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">{company.city} · {company.state}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-1">
                <div className="flex items-center">
                  {company.ratingAvg != null && !isNaN(Number(company.ratingAvg)) ? (
                    <div className="flex items-center gap-1">
                      <span className="text-amber-500 text-[13px]">★</span>
                      <span className="text-[13px] font-extrabold text-slate-800 dark:text-slate-200">{Number(company.ratingAvg).toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Novo</span>
                  )}
                </div>
                
                <a
                  href={`/companies/${company.slug}`}
                  className="inline-flex items-center justify-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-1.5 rounded-full shadow-sm shadow-blue-600/20 w-auto"
                >
                  Ver Perfil
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

