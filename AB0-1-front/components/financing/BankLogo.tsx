'use client';

import React from 'react';
import { Building2 } from 'lucide-react';

interface BankLogoProps {
  name?: string | null;
  logoUrl?: string | null;
  className?: string;
  size?: number;
}

export function BankLogo({ name = '', logoUrl, className = '', size = 22 }: BankLogoProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name || 'Banco'}
        className={`object-contain rounded shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const cleanName = (name || '').toLowerCase().trim();

  // 1. Banco do Brasil
  if (cleanName.includes('banco do brasil') || cleanName.includes('bb')) {
    return (
      <svg className={`shrink-0 rounded shadow-sm ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#FECE00" />
        <path d="M7 6L12 11L17 6H13.5L12 7.5L10.5 6H7Z" fill="#003366" />
        <path d="M7 18L12 13L17 18H13.5L12 16.5L10.5 18H7Z" fill="#003366" />
        <path d="M6 7L11 12L6 17V13.5L7.5 12L6 10.5V7Z" fill="#003366" />
        <path d="M18 7L13 12L18 17V13.5L16.5 12L18 10.5V7Z" fill="#003366" />
      </svg>
    );
  }

  // 2. Caixa Econômica Federal
  if (cleanName.includes('caixa')) {
    return (
      <svg className={`shrink-0 rounded shadow-sm ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#005CA9" />
        <path d="M6 6L14 18H18L10 6H6Z" fill="#FFFFFF" />
        <path d="M14 6L18 6L10 18H6L14 6Z" fill="#F37021" />
      </svg>
    );
  }

  // 3. Bradesco
  if (cleanName.includes('bradesco')) {
    return (
      <svg className={`shrink-0 rounded shadow-sm ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#CC0000" />
        <path d="M12 5C10 7.5 7.5 10 5 11.5V13.5C8 12 10.5 9.5 12 7C13.5 9.5 16 12 19 13.5V11.5C16.5 10 14 7.5 12 5Z" fill="#FFFFFF" />
        <rect x="11" y="7" width="2" height="12" fill="#FFFFFF" />
      </svg>
    );
  }

  // 4. Santander
  if (cleanName.includes('santander')) {
    return (
      <svg className={`shrink-0 rounded shadow-sm ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#EC0000" />
        <path d="M12 5C10.5 7.5 9 10 9 12.5C9 14.5 10.3 16 12 16C13.7 16 15 14.5 15 12.5C15 10 13.5 7.5 12 5Z" fill="#FFFFFF" />
      </svg>
    );
  }

  // 5. Sicredi
  if (cleanName.includes('sicredi')) {
    return (
      <svg className={`shrink-0 rounded shadow-sm ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#2E7D32" />
        <circle cx="12" cy="12" r="3" fill="#81C784" />
        <path d="M12 5V9M12 15V19M5 12H9M15 12H19" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // 6. Sicoob
  if (cleanName.includes('sicoob')) {
    return (
      <svg className={`shrink-0 rounded shadow-sm ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#003641" />
        <path d="M7 12L12 7L17 12L12 17L7 12Z" fill="#00AE9D" />
        <circle cx="12" cy="12" r="2" fill="#FFFFFF" />
      </svg>
    );
  }

  // 7. BV Financeira
  if (cleanName.includes('bv')) {
    return (
      <svg className={`shrink-0 rounded shadow-sm ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#002D62" />
        <text x="12" y="16" fontSize="11" fontWeight="bold" fill="#FFC72C" textAnchor="middle" fontFamily="sans-serif">BV</text>
      </svg>
    );
  }

  // 8. Solfácil
  if (cleanName.includes('solfacil') || cleanName.includes('solfácil')) {
    return (
      <svg className={`shrink-0 rounded shadow-sm ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#FF6B00" />
        <circle cx="12" cy="12" r="4" fill="#FFFFFF" />
        <path d="M12 5V7M12 17V19M5 12H7M17 12H19" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // Fallback genérico para outros bancos
  return (
    <div
      className={`shrink-0 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 ${className}`}
      style={{ width: size, height: size }}
    >
      <Building2 className="h-3.5 w-3.5" />
    </div>
  );
}
