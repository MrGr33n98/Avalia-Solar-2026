'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { buildApiUrl } from '@/lib/api-config';

function ConfirmEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [autoLoginToken, setAutoLoginToken] = useState<string | null>(null);

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // SEGURANÇA: Extrair token do hash fragment (não da query string)
        const hash = window.location.hash;
        
        // Bloquear tokens na URL (query string)
        const queryToken = searchParams.get('confirmation_token') || searchParams.get('token');
        if (queryToken) {
          console.error('[Security] Token detected in query string - blocking');
          setStatus('error');
          setMessage('Link inválido. Por favor, use o link enviado por email.');
          // Remover token da URL
          window.history.replaceState({}, document.title, '/confirm-email');
          return;
        }

        // Extrair token do hash (#token=...)
        if (!hash || !hash.includes('token=')) {
          setStatus('error');
          setMessage('Token de confirmação não encontrado. Verifique o link no email.');
          return;
        }

        const tokenMatch = hash.match(/token=([^&]+)/);
        if (!tokenMatch || !tokenMatch[1]) {
          setStatus('error');
          setMessage('Token inválido. Por favor, use o link enviado por email.');
          return;
        }

        const token = decodeURIComponent(tokenMatch[1]);
        console.log('[ConfirmEmail] Token extracted from hash fragment');

        // Remover hash imediatamente da URL (segurança)
        window.history.replaceState({}, document.title, '/confirm-email');

        // Enviar token para backend via Authorization header
        const url = buildApiUrl('auth/confirm_email');
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Token no header (seguro)
          },
          credentials: 'include', // Cookies httpOnly
        });

        // Capturar resposta bruta para debug se não for OK ou se não for JSON
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.error('[ConfirmEmail] Non-JSON response received:', text);
          throw new Error(`Resposta do servidor inválida (${response.status}). Por favor, contate o suporte.`);
        }

        if (response.ok) {
          console.log('[ConfirmEmail] Email confirmed successfully');
          setStatus('success');
          setMessage(data.message || 'Email confirmado com sucesso!');

          // Se backend retornou token de sessão, armazenar
          if (data.auto_login && data.token) {
            setAutoLoginToken(data.token);
            // Armazenar no localStorage no formato esperado pelo api.ts e AuthContext
            if (typeof window !== 'undefined') {
              const authData = {
                token: data.token,
                user: data.user
              };
              localStorage.setItem('auth', JSON.stringify(authData));
              // Também manter compatibilidade se outros lugares usarem jwt_token
              localStorage.setItem('jwt_token', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
            }

            // Redirecionar para dashboard após 2 segundos
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 2000);
          } else {
            // Redirecionar para login após 3 segundos
            setTimeout(() => {
              router.push('/login');
            }, 3000);
          }
        } else {
          console.error('[ConfirmEmail] Confirmation failed:', data);
          setStatus('error');
          setMessage(data.message || 'Erro ao confirmar email. O link pode ter expirado.');
        }
      } catch (error: any) {
        console.error('[ConfirmEmail] Unexpected error:', error);
        setStatus('error');
        setMessage(error.message || 'Erro inesperado ao confirmar email. Tente novamente mais tarde.');
      }
    };

    confirmEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Confirmando seu email...'}
            {status === 'success' && 'Email Confirmado!'}
            {status === 'error' && 'Erro na Confirmação'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Por favor, aguarde um momento.'}
            {status === 'success' && autoLoginToken ? 'Você será redirecionado para o dashboard.' : 'Você será redirecionado para o login.'}
            {status === 'error' && 'Verifique as informações abaixo.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>

          <p className="text-center text-sm text-gray-600">
            {message}
          </p>

          {status === 'error' && (
            <div className="space-y-2 pt-4">
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
                variant="outline"
              >
                Ir para Login
              </Button>
              <Button
                onClick={() => router.push('/resend-confirmation')}
                className="w-full"
              >
                Reenviar Email de Confirmação
              </Button>
            </div>
          )}

          {status === 'success' && (
            <div className="pt-4">
              <Button
                onClick={() => router.push(autoLoginToken ? '/dashboard' : '/login')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {autoLoginToken ? 'Ir para Dashboard' : 'Fazer Login'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Confirmando seu email...</CardTitle>
            <CardDescription>Por favor, aguarde um momento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
}
