'use client';

import { useId } from 'react';

export interface AvaliaPadlockIconProps {
  className?: string;
  locked?: boolean;
}

export function AvaliaPadlockIcon({
  className = 'h-12 w-12',
  locked = false,
}: AvaliaPadlockIconProps) {
  const uid = useId();
  const cleanId = uid.replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Fundo Azul Claro Luminoso (zero preto) */}
        <linearGradient
          id={`bg-light-${cleanId}`}
          x1="8"
          y1="8"
          x2="56"
          y2="56"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#EFF6FF" />
          <stop offset="100%" stopColor="#DBEAFE" />
        </linearGradient>

        {/* Argola em Azul Royal Institucional */}
        <linearGradient
          id={`shackle-blue-${cleanId}`}
          x1="24"
          y1="11"
          x2="40"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1649E5" />
        </linearGradient>

        {/* Sombra Suave Azulada para destacar o corpo branco sem contorno escuro */}
        <filter
          id={`soft-shadow-${cleanId}`}
          x="12"
          y="23"
          width="40"
          height="34"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="3"
            floodColor="#1649E5"
            floodOpacity="0.14"
          />
        </filter>
      </defs>

      {/* Halo Circular Azul Claro com Borda Fina Cristalina */}
      <circle
        cx="32"
        cy="32"
        r="29"
        fill={`url(#bg-light-${cleanId})`}
        stroke="#BFDBFE"
        strokeWidth="1.5"
      />
      <circle
        cx="32"
        cy="32"
        r="27.2"
        stroke="#FFFFFF"
        strokeOpacity="0.85"
        strokeWidth="1.2"
      />

      {/* Argola do Cadeado em Azul Royal (Aberta ou Fechada) */}
      {locked ? (
        <path
          d="M23.5 28.5V20C23.5 15.3056 27.3056 11.5 32 11.5C36.6944 11.5 40.5 15.3056 40.5 20V28.5"
          stroke={`url(#shackle-blue-${cleanId})`}
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M40.5 28.5V20C40.5 15.3056 36.6944 11.5 32 11.5C27.84 11.5 24.38 14.49 23.65 18.44"
          stroke={`url(#shackle-blue-${cleanId})`}
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      )}

      {/* Corpo Branco Puro com Borda Suave Azul-Celeste (sem traço preto) */}
      <g filter={`url(#soft-shadow-${cleanId})`}>
        <path
          d="M18.5 31C18.5 29.3431 19.8431 28 21.5 28H42.5C44.1569 28 45.5 29.3431 45.5 31V46.5L42 50H22L18.5 46.5V31Z"
          fill="#FFFFFF"
          stroke="#93C5FD"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </g>

      {/* Símbolo Oficial Avalia Solar Centralizado */}
      <g transform="translate(22.5, 31.2)">
        {/* Asa Superior Dourada (#F5B800) */}
        <path d="M18.5 1L0.5 7.6L7.6 9.8L18.5 1Z" fill="#F5B800" />
        {/* Dobra Direita Âmbar */}
        <path d="M18.5 1L10.8 17.5L8.9 11L18.5 1Z" fill="#EAB308" />
        {/* Dobra Interna Azul Royal (#1649E5) */}
        <path d="M18.5 1L7.6 9.8L8.9 11L18.5 1Z" fill="#1649E5" />
        {/* Base Azul Profundo (#1E3A8A — mais luminoso que preto) */}
        <path d="M8.9 11L10.8 17.5L12 11.8L8.9 11Z" fill="#1E3A8A" />
      </g>
    </svg>
  );
}

export default AvaliaPadlockIcon;

