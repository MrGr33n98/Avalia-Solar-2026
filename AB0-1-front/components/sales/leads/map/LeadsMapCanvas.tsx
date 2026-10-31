'use client';

import React, { useEffect, useImperativeHandle, forwardRef, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L, { LatLngBoundsExpression } from 'leaflet';
import { useTheme } from 'next-themes';
import { MunicipalityLocationDTO } from '@/lib/api/sales/types';
import { MunicipalityMarker } from './MunicipalityMarker';
import 'leaflet/dist/leaflet.css';

export interface LeadsMapCanvasRef {
  fitBounds: () => void;
}

interface LeadsMapCanvasProps {
  locations: MunicipalityLocationDTO[];
  selectedLocationKey?: string | null;
  onSelectMunicipality: (location: MunicipalityLocationDTO) => void;
  className?: string;
}

// Subcomponente interno para manipular o mapa (zoom/fitBounds)
const MapBoundsController = forwardRef<LeadsMapCanvasRef, { locations: MunicipalityLocationDTO[] }>(
  ({ locations }, ref) => {
    const map = useMap();
    const hasInitializedRef = useRef(false);

    const fitAll = useCallback(() => {
      if (locations.length === 0) {
        map.setView([-14.235, -51.925], 4);
        return;
      }

      if (locations.length === 1) {
        map.setView([locations[0].latitude, locations[0].longitude], 10);
        return;
      }

      const bounds: LatLngBoundsExpression = locations.map((loc) => [loc.latitude, loc.longitude]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }, [locations, map]);

    useImperativeHandle(ref, () => ({
      fitBounds: fitAll,
    }));

    useEffect(() => {
      if (!hasInitializedRef.current && locations.length > 0) {
        hasInitializedRef.current = true;
        fitAll();
      }
    }, [locations, fitAll]);

    return null;
  }
);
MapBoundsController.displayName = 'MapBoundsController';

export const LeadsMapCanvas = forwardRef<LeadsMapCanvasRef, LeadsMapCanvasProps>(
  ({ locations, selectedLocationKey, onSelectMunicipality, className = '' }, ref) => {
    const { theme } = useTheme();
    const boundsControllerRef = useRef<LeadsMapCanvasRef>(null);

    useImperativeHandle(ref, () => ({
      fitBounds: () => boundsControllerRef.current?.fitBounds(),
    }));

    useEffect(() => {
      // Fix default Leaflet icon paths in Next.js bundler
      const iconProto = L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string };
      delete iconProto._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    }, []);

    const isDark = theme === 'dark';
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tileAttribution =
      '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    return (
      <div className={`relative w-full h-full min-h-[460px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 ${className}`}>
        <MapContainer
          center={[-14.235, -51.925]}
          zoom={4}
          scrollWheelZoom={true}
          className="w-full h-full z-0 font-sans"
        >
          <TileLayer url={tileUrl} attribution={tileAttribution} />
          <MapBoundsController ref={boundsControllerRef} locations={locations} />

          {locations.map((loc) => (
            <MunicipalityMarker
              key={loc.key}
              location={loc}
              isSelected={loc.key === selectedLocationKey}
              onSelect={onSelectMunicipality}
            />
          ))}
        </MapContainer>
      </div>
    );
  }
);
LeadsMapCanvas.displayName = 'LeadsMapCanvas';

