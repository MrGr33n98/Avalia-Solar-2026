'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'form' | 'loading' | 'success' | 'error'>('form');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [autoLoginToken, setAutoLoginToken] = useState<string | null>(null);

  useEffect(() => {
    // SEGURANÇA: Extrair token do hash fragment (não da query string)
    const hash = window.location.hash;
    
    // Bloquear tokens na URL (query string)
    const queryToken = searchParams.get('reset_password_token') || searchParams.get('token');
    if (queryToken) {
      console.error('[Security] Token detected in query string - blocking');
      setStatus('error');
      setMessage('Link inválido. Por favor, use o link enviado por email.');
      // Remover token da URL
      window.history.replaceState({}, document.title, '/reset-password');
      return;
    }

    // Extrair token do hash (#token=...)
    if (!hash || !hash.includes('token=')) {
      setStatus('error');
      setMessage('Token não encontrado. Verifique o link no email.');
      return;
    }

    const tokenMatch = hash.match(/token=([^&]+)/);
    if (!tokenMatch || !tokenMatch[1]) {
      setStatus('error');
      setMessage('Token inválido. Por favor, use o link enviado por email.');
      return;
    }

    const extractedToken = decodeURIComponent(tokenMatch[1]);
    setToken(extractedToken);
    console.log('[ResetPassword] Token extracted from hash fragment');

    // Remover hash imediatamente da URL (segurança)
    window.history.replaceState({}, document.title, '/reset-password');
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setStatus('error');
      setMessage('Token não encontrado. Solicite um novo link de redefinição.');
      return;
    }

    if (password.length < 8) {
      setStatus('error');
      setMessage('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (password !== passwordConfirmation) {
      setStatus('error');
      setMessage('As senhas não coincidem.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.avaliasolar.com.br';
      const response = await fetch(`${apiUrl}/api/v1/auth/reset_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Token no header (seguro)
        },
        credentials: 'include', // Cookies httpOnly
        body: JSON.stringify({
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('[ResetPassword] Password reset successfully');
        setStatus('success');
        setMessage(data.message || 'Senha redefinida com sucesso!');

        // Se backend retornou token de sessão, armazenar
        if (data.auto_login && data.token) {
          setAutoLoginToken(data.token);
          // Armazenar no localStorage (ou cookie se backend configurou)
          if (typeof window !== 'undefined') {
            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
          }

          // Redirecionar para dashboard após 2 segundos
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          // Redirecionar para login após 3 segundos
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } else {
        console.error('[ResetPassword] Reset failed:', data);
        setStatus('error');
        setMessage(data.message || 'Erro ao redefinir senha. O link pode ter expirado.');
      }
    } catch (error) {
      console.error('[ResetPassword] Error:', error);
      setStatus('error');
      setMessage('Erro ao redefinir senha. Por favor, tente novamente.');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Senha Redefinida!</CardTitle>
            <CardDescription>
              {autoLoginToken ? 'Você será redirecionado para o dashboard.' : 'Você será redirecionado para o login.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <p className="text-center text-sm text-gray-600">{message}</p>
            <Button
              onClick={() => router.push(autoLoginToken ? '/dashboard' : '/login')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {autoLoginToken ? 'Ir para Dashboard' : 'Fazer Login'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error' && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Erro</CardTitle>
            <CardDescription>Verifique as informações abaixo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>
            <p className="text-center text-sm text-gray-600">{message}</p>
            <div className="space-y-2">
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
                variant="outline"
              >
                Ir para Login
              </Button>
              <Button
                onClick={() => router.push('/forgot-password')}
                className="w-full"
              >
                Solicitar Novo Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  disabled={status === 'loading'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="password_confirmation"
                  type={showPasswordConfirmation ? 'text' : 'password'}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Digite a senha novamente"
                  required
                  minLength={8}
                  disabled={status === 'loading'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {status === 'error' && message && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {message}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                'Redefinir Senha'
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              <a href="/login" className="text-blue-600 hover:underline">
                Voltar para Login
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Carregando...</CardTitle>
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
      <ResetPasswordContent />
    </Suspense>
  );
}
