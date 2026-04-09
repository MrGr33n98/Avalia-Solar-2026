'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';

type CallbackStatus = 'loading' | 'success' | 'pending_approval' | 'inactive' | 'error';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, refreshAuth } = useAuth();

  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inactiveReason, setInactiveReason] = useState<string | null>(null);
  const refreshCalled = useRef(false);

  // Step 1: parse URL params and kick off auth refresh on success
  useEffect(() => {
    const rawStatus = searchParams.get('status');
    const rawMessage = searchParams.get('message');
    const rawReason = searchParams.get('reason');

    if (rawStatus === 'pending_approval') {
      setStatus('pending_approval');
      return;
    }

    if (rawStatus === 'inactive') {
      setInactiveReason(rawReason ? decodeURIComponent(rawReason) : null);
      setStatus('inactive');
      return;
    }

    if (rawStatus === 'error') {
      setErrorMessage(rawMessage ? decodeURIComponent(rawMessage) : 'Ocorreu um erro durante o login.');
      setStatus('error');
      return;
    }

    if (rawStatus === 'success') {
      if (refreshCalled.current) return;
      refreshCalled.current = true;

      refreshAuth().then((ok) => {
        if (!ok) {
          setErrorMessage('Não foi possível carregar sua sessão após o login. Tente novamente.');
          setStatus('error');
        }
        // On success: status stays 'loading' while user state propagates,
        // then the next effect will route the user.
      });
      return;
    }

    // No recognized status — redirect to login
    router.replace('/login');
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 2: once user is loaded after a successful refresh, route them
  useEffect(() => {
    if (status !== 'loading' || !refreshCalled.current) return;
    if (loading) return;
    if (!user) return;

    if (user.role === 'review') {
      router.replace('/review-dashboard');
    } else if (user.role === 'company') {
      router.replace('/select-company');
    } else {
      router.replace('/');
    }
  }, [status, loading, user, router]);

  // --- Render ---

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 text-sm">Finalizando login...</p>
        </div>
      </div>
    );
  }

  if (status === 'pending_approval') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Aguardando aprovação</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Sua conta está pendente de aprovação pelo administrador. Você receberá um e-mail assim
            que sua conta for aprovada.
          </p>
          <Link href="/login" className="inline-block mt-2 text-blue-600 hover:underline text-sm">
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'inactive') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Conta inativa</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            {inactiveReason
              ? `Sua conta está com o status "${inactiveReason}".`
              : 'Sua conta está inativa.'}{' '}
            Entre em contato com o suporte para mais informações.
          </p>
          <Link href="/login" className="inline-block mt-2 text-blue-600 hover:underline text-sm">
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  // error
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Erro no login</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          {errorMessage || 'Ocorreu um erro durante o login. Por favor, tente novamente.'}
        </p>
        <Link
          href="/login"
          className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tentar novamente
        </Link>
      </div>
    </div>
  );
}
