'use client';

import { useId } from 'react';

export interface AvaliaShieldBadgeProps {
  className?: string;
}

export function AvaliaShieldBadge({ className = 'h-14 w-14' }: AvaliaShieldBadgeProps) {
  const uid = useId();
  const cleanId = uid.replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Fundo do Squircle Glass */}
        <linearGradient
          id={`sq-bg-${cleanId}`}
          x1="16"
          y1="12"
          x2="104"
          y2="108"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
          <stop offset="55%" stopColor="#F0F7FF" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#DCEBFF" stopOpacity="0.95" />
        </linearGradient>

        {/* Borda externa azul-celeste do squircle */}
        <linearGradient
          id={`sq-stroke-${cleanId}`}
          x1="20"
          y1="10"
          x2="100"
          y2="110"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="50%" stopColor="#7CC4FA" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>

        {/* Faceta esquerda do escudo (brilho e iluminação superior esquerda) */}
        <linearGradient
          id={`sh-left-${cleanId}`}
          x1="34"
          y1="26"
          x2="60"
          y2="94"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#5BB6FA" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        {/* Faceta direita do escudo (profundidade e vinco 3D) */}
        <linearGradient
          id={`sh-right-${cleanId}`}
          x1="60"
          y1="26"
          x2="86"
          y2="94"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="55%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1649E5" />
        </linearGradient>

        {/* Sombra difusa do squircle glass */}
        <filter
          id={`sq-shadow-${cleanId}`}
          x="4"
          y="6"
          width="112"
          height="112"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="5"
            floodColor="#1649E5"
            floodOpacity="0.16"
          />
        </filter>

        {/* Sombra de elevação do escudo */}
        <filter
          id={`sh-shadow-${cleanId}`}
          x="26"
          y="23"
          width="68"
          height="76"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="3.5"
            floodColor="#1E3A8A"
            floodOpacity="0.24"
          />
        </filter>

        {/* Sombra sutil do origami interno */}
        <filter
          id={`logo-shadow-${cleanId}`}
          x="40"
          y="42"
          width="42"
          height="38"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            dx="0"
            dy="1.5"
            stdDeviation="1.5"
            floodColor="#0B1536"
            floodOpacity="0.22"
          />
        </filter>
      </defs>

      {/* Container Squircle Externo */}
      <g filter={`url(#sq-shadow-${cleanId})`}>
        <rect
          x="12"
          y="12"
          width="96"
          height="96"
          rx="28"
          fill={`url(#sq-bg-${cleanId})`}
          stroke={`url(#sq-stroke-${cleanId})`}
          strokeWidth="2.2"
        />
        {/* Anel interno branco luminoso */}
        <rect
          x="15.5"
          y="15.5"
          width="89"
          height="89"
          rx="24.5"
          stroke="#FFFFFF"
          strokeWidth="2.6"
        />
      </g>

      {/* Brasão 3D Facetado */}
      <g filter={`url(#sh-shadow-${cleanId})`}>
        {/* Base completa (lado esquerdo) */}
        <path
          d="M58.2 27.6C59.3 27.1 60.7 27.1 61.8 27.6L84.8 36.4C86.2 36.9 87.2 38.3 87.2 39.8V58.8C87.2 74.8 76.2 86.6 61.6 92.6C60.6 93 59.4 93 58.4 92.6C43.8 86.6 32.8 74.8 32.8 58.8V39.8C32.8 38.3 33.8 36.9 35.2 36.4L58.2 27.6Z"
          fill={`url(#sh-left-${cleanId})`}
        />

        {/* Metade direita (vinco central 3D) */}
        <path
          d="M60 27.2C60.6 27.2 61.2 27.3 61.8 27.6L84.8 36.4C86.2 36.9 87.2 38.3 87.2 39.8V58.8C87.2 74.8 76.2 86.6 61.6 92.6C61.1 92.8 60.5 92.9 60 92.9V27.2Z"
          fill={`url(#sh-right-${cleanId})`}
        />

        {/* Borda externa sutil de brilho no escudo */}
        <path
          d="M58.2 27.6C59.3 27.1 60.7 27.1 61.8 27.6L84.8 36.4C86.2 36.9 87.2 38.3 87.2 39.8V58.8C87.2 74.8 76.2 86.6 61.6 92.6C60.6 93 59.4 93 58.4 92.6C43.8 86.6 32.8 74.8 32.8 58.8V39.8C32.8 38.3 33.8 36.9 35.2 36.4L58.2 27.6Z"
          stroke="#7CC4FA"
          strokeOpacity="0.65"
          strokeWidth="1.2"
        />

        {/* Friso Duplo Interno */}
        <path
          d="M60 32.2L82.5 40.8V58.5C82.5 72.2 73 82.4 60 87.8C47 82.4 37.5 72.2 37.5 58.5V40.8L60 32.2Z"
          stroke="#93C5FD"
          strokeOpacity="0.85"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M60 36.2L79 43.5V58.2C79 69.9 70.9 78.7 60 83.4C49.1 78.7 41 69.9 41 58.2V43.5L60 36.2Z"
          stroke="#BFDBFE"
          strokeOpacity="0.55"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </g>

      {/* Símbolo Oficial Avalia Solar Centralizado */}
      <g filter={`url(#logo-shadow-${cleanId})`} transform="translate(43.5, 45.5)">
        {/* Asa Superior Dourada (#F5B800) */}
        <path d="M33.5 1L0.5 13.4L13.2 17.3L33.5 1Z" fill="#F5B800" />
        {/* Asa Direita Âmbar */}
        <path d="M33.5 1L19.6 30.2L16.1 19.2L33.5 1Z" fill="#EAB308" />
        {/* Dobra Central Azul Royal (#1649E5) */}
        <path d="M33.5 1L13.2 17.3L16.1 19.2L33.5 1Z" fill="#1649E5" />
        {/* Base Profunda Navy (#0B1536) */}
        <path d="M16.1 19.2L19.6 30.2L21.8 20.5L16.1 19.2Z" fill="#0B1536" />
      </g>
    </svg>
  );
}

export function SecurityGuaranteeCard({ className }: { className?: string }) {
  return (
    <div
      className={
        className ||
        'flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:items-center'
      }
    >
      <AvaliaShieldBadge className="h-12 w-12 sm:h-14 sm:w-14 shrink-0" />

      <div className="space-y-1">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-950">
          Garantia de Segurança
        </h4>
        <p className="text-[12px] leading-relaxed text-slate-500">
          O portal <strong className="font-semibold text-slate-900">Avalia Solar</strong> valida e
          modera ativamente todas as avaliações deste perfil. Nossos especialistas asseguram
          orçamentos protegidos de ponta a ponta.
        </p>
      </div>
    </div>
  );
}

export default AvaliaShieldBadge;

