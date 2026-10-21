import Link from 'next/link';
import { Heart, LogIn, UserPlus, Building2, Package, CheckCircle2 } from 'lucide-react';

interface FavoritesVisitorStateProps {
  redirectPath?: string;
}

export function FavoritesVisitorState({ redirectPath = '/favorites' }: FavoritesVisitorStateProps) {
  const loginUrl = `/login?redirect=${encodeURIComponent(redirectPath)}`;
  const registerUrl = `/register?redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 shadow-inner">
        <Heart className="h-8 w-8 fill-rose-500/20 text-rose-500" aria-hidden="true" />
      </div>

      <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Salve e acesse seus favoritos
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm sm:text-base text-slate-600">
        Faça login para consultar suas empresas e produtos solares favoritos salvos em qualquer dispositivo.
      </p>

      {/* Vantagens */}
      <div className="mx-auto mt-6 max-w-md space-y-2.5 text-left text-xs sm:text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>Acompanhe empresas verificadas e avaliações reais</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>Compare equipamentos e soluções para o seu telhado</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>Peça orçamentos com 1 clique quando estiver pronto</span>
        </div>
      </div>

      {/* Ações principais de login / cadastro */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href={loginUrl}
          className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          <span>Entrar para ver meus favoritos</span>
        </Link>
        <Link
          href={registerUrl}
          className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          <span>Criar uma conta</span>
        </Link>
      </div>

      {/* Exploração livre */}
      <div className="mt-8 border-t border-slate-100 pt-6">
        <p className="text-xs font-medium text-slate-400">Quer continuar pesquisando antes de entrar?</p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <Link
            href="/companies"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            <Building2 className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            Explorar empresas
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            <Package className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            Explorar produtos
          </Link>
        </div>
      </div>
    </div>
  );
}
