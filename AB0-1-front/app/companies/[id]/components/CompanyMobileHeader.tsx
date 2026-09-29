'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Search, MoreVertical } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';

interface CompanyMobileHeaderProps {
  onShare?: () => void;
}

export default function CompanyMobileHeader({ onShare }: CompanyMobileHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/companies');
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 backdrop-blur-md md:hidden">
      {/* Left: Back button + Empresas label */}
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-0.5 rounded-lg text-slate-700 transition-colors hover:text-slate-900 active:scale-95"
        aria-label="Voltar para empresas"
      >
        <ChevronLeft className="h-5 w-5 shrink-0 text-slate-600" />
        <span className="text-sm font-bold tracking-tight text-slate-800">Empresas</span>
      </button>

      {/* Center: Avalia Solar Logo */}
      <Link href="/" aria-label="Ir para a home da Avalia Solar" className="flex items-center justify-center">
        <BrandLogo className="h-5 w-auto" priority />
      </Link>

      {/* Right: Search + Options */}
      <div className="flex items-center gap-1">
        <Link
          href="/search"
          aria-label="Buscar no Avalia Solar"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Search className="h-4.5 w-4.5" />
        </Link>
        <button
          type="button"
          onClick={onShare}
          aria-label="Opções"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <MoreVertical className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}
