'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, Layers, MapPin, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PersonMapHeroProps {
  name: string;
  city?: string | null;
  state?: string | null;
  companyName?: string | null;
}

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'sao paulo': { lat: -23.5505, lng: -46.6333 },
  sp: { lat: -23.5505, lng: -46.6333 },
  'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
  rj: { lat: -22.9068, lng: -43.1729 },
  'belo horizonte': { lat: -19.9167, lng: -43.9345 },
  mg: { lat: -19.9167, lng: -43.9345 },
  curitiba: { lat: -25.4284, lng: -49.2733 },
  pr: { lat: -25.4284, lng: -49.2733 },
  brasilia: { lat: -15.7975, lng: -47.8919 },
  df: { lat: -15.7975, lng: -47.8919 },
  'porto alegre': { lat: -30.0346, lng: -51.2177 },
  rs: { lat: -30.0346, lng: -51.2177 },
  salvador: { lat: -12.9777, lng: -38.5016 },
  ba: { lat: -12.9777, lng: -38.5016 },
  campinas: { lat: -22.9056, lng: -47.0608 },
  goiania: { lat: -16.6869, lng: -49.2648 },
  go: { lat: -16.6869, lng: -49.2648 },
  recife: { lat: -8.0476, lng: -34.877 },
  pe: { lat: -8.0476, lng: -34.877 },
  fortaleza: { lat: -3.7172, lng: -38.5433 },
  ce: { lat: -3.7172, lng: -38.5433 },
  florianopolis: { lat: -27.5954, lng: -48.548 },
  sc: { lat: -27.5954, lng: -48.548 },
};

export default function PersonMapHero({ name, city, state, companyName: _companyName }: PersonMapHeroProps) {
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');

  const coords = useMemo(() => {
    const rawCity = (city || '').toLowerCase().trim();
    const rawState = (state || '').toLowerCase().trim();
    if (rawCity && CITY_COORDINATES[rawCity]) return CITY_COORDINATES[rawCity];
    if (rawState && CITY_COORDINATES[rawState]) return CITY_COORDINATES[rawState];
    return CITY_COORDINATES['sao paulo'];
  }, [city, state]);

  const locationLabel = [city, state].filter(Boolean).join(', ') || 'São Paulo, SP';
  const bbox = `${coords.lng - 0.04},${coords.lat - 0.03},${coords.lng + 0.04},${coords.lat + 0.03}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`;
  const externalMapUrl = `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=14/${coords.lat}/${coords.lng}`;

  return (
    <div className="relative w-full h-40 md:h-44 rounded-t-xl overflow-hidden border border-slate-200/90 shadow-xs bg-slate-100">
      {/* Map iframe embed */}
      <iframe
        title={`Mapa de localização de ${name}`}
        src={osmEmbedUrl}
        className="w-full h-full border-0 pointer-events-auto filter saturate-90 contrast-95"
        loading="lazy"
      />

      {/* Top Left: Nutshell-style Person Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <Badge className="bg-white/95 hover:bg-white text-slate-800 border border-slate-200/80 shadow-sm px-2.5 py-1 text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 transition-all">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
          <span>Person</span>
        </Badge>
        <span className="hidden sm:inline-flex text-[11px] font-medium bg-black/60 text-white px-2 py-0.5 rounded backdrop-blur-xs">
          {locationLabel}
        </span>
      </div>

      {/* Top Right: Layer Toggle and External Link */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setMapType((prev) => (prev === 'streets' ? 'satellite' : 'streets'))}
          className="bg-white/90 hover:bg-white text-slate-700 p-1.5 rounded-md shadow-xs border border-slate-200 text-xs flex items-center gap-1 backdrop-blur-xs transition"
          title="Alternar camada do mapa"
        >
          <Layers className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden md:inline text-[11px] font-medium">{mapType === 'streets' ? 'Satélite' : 'Ruas'}</span>
        </button>
        <a
          href={externalMapUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-white/90 hover:bg-white text-slate-700 p-1.5 rounded-md shadow-xs border border-slate-200 text-xs flex items-center gap-1 backdrop-blur-xs transition"
          title="Abrir no OpenStreetMap"
        >
          <Navigation className="w-3.5 h-3.5 text-indigo-600" />
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>
      </div>

      {/* Bottom overlay gradient */}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-900/30 to-transparent pointer-events-none" />
    </div>
  );
}
