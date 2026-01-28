'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, MailCheck } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

function ConfirmEmailContent() {
  const router = useRouter();
  const { refreshAuth, user, isAuthenticated } = useAuth();
  const params = useParams<{ token: string }>();
  const token = useMemo(() => {
    const t: unknown = params?.token;
    if (Array.isArray(t)) return t[0] || '';
    return typeof t === 'string' ? t : '';
  }, [params]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        setIsLoading(false);
        setError('Token invalido.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await fetchApi('/auth/confirm_email', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (cancelled) return;

        // Tenta atualizar o estado de autenticação automaticamente
        const authRefreshed = await refreshAuth();
        
        if (cancelled) return;
        
        setIsSuccess(true);
        
        // Se estiver autenticado, redireciona para o dashboard após um breve delay
        if (authRefreshed) {
          setTimeout(() => {
            if (!cancelled) router.push('/dashboard');
          }, 3000);
        }
      } catch (err: any) {
        if (cancelled) return;
        const status = err?.context?.status;
        const message = err?.message || 'Nao foi possivel confirmar seu e-mail.';
        if (status === 422 || `${message}`.includes('[422]')) {
          setError('Token invalido ou expirado. Solicite um novo link de confirmacao.');
        } else {
          setError(message);
        }
      } finally {
        if (cancelled) return;
        setIsLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token, refreshAuth, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-2xl p-8 space-y-6 border border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Confirmacao de e-mail</h1>
            <p className="text-slate-600 mt-1">Validando seu link de confirmacao.</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <MailCheck className="h-5 w-5" />
          </div>
        </div>

        {isLoading && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex items-center gap-3 text-slate-700">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-sm">Confirmando...</p>
          </div>
        )}

        {!isLoading && isSuccess && (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-700">E-mail confirmado</p>
              <p className="text-sm text-emerald-700/80">
                {isAuthenticated 
                  ? `Olá, ${user?.name || 'Usuário'}. Sua conta foi confirmada e você já está logado. Redirecionando...`
                  : 'Sua conta foi confirmada com sucesso. Você já pode fazer login.'}
              </p>
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Não foi possível confirmar</p>
              <p className="text-sm text-red-700/80">{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {isAuthenticated ? (
            <Button asChild className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link href="/dashboard">Ir para o Dashboard</Link>
            </Button>
          ) : (
            <Button asChild className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link href="/login">Ir para o login</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="w-full h-11">
            <Link href="/forgot-password">Recuperar senha</Link>
          </Button>
        </div>

        <div className="text-sm text-slate-600 flex items-center justify-center">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Voltar para o inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-600">Carregando...</div>}>
      <ConfirmEmailContent />
    </Suspense>
  );
}

