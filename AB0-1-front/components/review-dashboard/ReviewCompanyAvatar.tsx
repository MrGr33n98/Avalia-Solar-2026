'use client';

import { useState } from 'react';

interface ReviewCompanyAvatarProps {
  name: string;
  logoUrl?: string | null;
  size?: 'sm' | 'md';
}

export function ReviewCompanyAvatar({ name, logoUrl, size = 'md' }: ReviewCompanyAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'AS';

  return (
    <span
      className={
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#DDE5EF] bg-[#F4F7FB] font-semibold text-[#17468D] ' +
        (size === 'sm' ? 'h-9 w-9 text-[10px]' : 'h-11 w-11 text-xs')
      }
      aria-label={'Empresa: ' + name}
    >
      {logoUrl && !imageFailed ? (
        // Logotipos são fornecidos pelos próprios perfis das empresas cadastradas.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-contain p-1"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}
