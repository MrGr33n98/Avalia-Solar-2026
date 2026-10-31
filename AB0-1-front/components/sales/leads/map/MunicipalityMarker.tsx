'use client';

import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MunicipalityLocationDTO } from '@/lib/api/sales/types';

interface MunicipalityMarkerProps {
  location: MunicipalityLocationDTO;
  isSelected?: boolean;
  onSelect: (location: MunicipalityLocationDTO) => void;
}

export const MunicipalityMarker: React.FC<MunicipalityMarkerProps> = ({
  location,
  isSelected = false,
  onSelect,
}) => {
  const icon = useMemo(() => {
    const count = location.lead_count;
    let size = 32;
    let bgStyle = 'background-color: #0F62FE;'; // IBM Carbon blue

    if (count >= 20) {
      size = 40;
      bgStyle = 'background-color: #002D9C;';
    } else if (count >= 5) {
      size = 36;
      bgStyle = 'background-color: #0043CE;';
    }

    const borderStyle = isSelected
      ? 'border: 3px solid #FFCD2D; box-shadow: 0 0 12px rgba(15, 98, 254, 0.6);'
      : 'border: 2px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);';

    const html = `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        ${bgStyle}
        ${borderStyle}
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 800;
        font-size: ${size >= 40 ? 14 : 12}px;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
        ${count}
      </div>
    `;

    return L.divIcon({
      html,
      className: 'municipality-lead-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, [location.lead_count, isSelected]);

  const formattedValue = `R$ ${(location.value_cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onSelect(location),
      }}
    >
      <Popup>
        <div className="p-1 space-y-1 text-slate-800">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1">
            <h4 className="font-bold text-sm text-slate-900">
              {location.city}, {location.state}
            </h4>
            <span className="font-extrabold text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-800">
              {location.lead_count} {location.lead_count === 1 ? 'lead' : 'leads'}
            </span>
          </div>
          <div className="text-xs space-y-0.5 pt-0.5">
            <p className="font-semibold text-slate-700">
              Valor Total: <strong className="text-blue-950 font-bold">{formattedValue}</strong>
            </p>
            <p className="text-[10px] text-slate-400 italic">
              Posição aproximada (centro do município)
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelect(location)}
            className="w-full mt-2 py-1 px-2 text-center text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
          >
            Ver {location.lead_count} Leads da Cidade &rarr;
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

