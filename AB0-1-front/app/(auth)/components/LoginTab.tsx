'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginTabProps {
  onCreateAccount?: () => void;
}

type LoginError = {
  message?: string;
  status?: number | string;
  context?: {
    status?: number;
    details?: { code?: string | number };
  };
};

export default function LoginTab({ onCreateAccount }: LoginTabProps) {
  const {
    login,
    getPostLoginDestination,
    signInWithGoogle,
    signInWithLinkedIn,
    resendConfirmation,
  } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Check for error codes in URL
  useEffect(() => {
    const errorCode = searchParams.get('error');
    if (errorCode === 'session_expired') {
      setError('Sua sessão expirou. Por favor, faça login novamente.');
    } else if (errorCode === 'unauthorized') {
      setError('Você não tem permissão para acessar esta página.');
    }
  }, [searchParams]);

  const rawReturnTo = searchParams.get('return_to') || searchParams.get('redirect');
  const safeReturnTo =
    rawReturnTo && rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//')
      ? rawReturnTo
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setNeedsConfirmation(false);
    setResendMessage(null);
    try {
      const authenticatedUser = await login(email, password);
      const destination = await getPostLoginDestination(authenticatedUser, safeReturnTo);
      router.push(destination);
    } catch (error: unknown) {
      const err = error as LoginError;
      const code = err.context?.details?.code || err.status || 'UNKNOWN';

      if (code === 'EMAIL_NOT_CONFIRMED' || err.message?.includes('confirme seu e-mail')) {
        setNeedsConfirmation(true);
        setError(
          'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou reenvie o link.'
        );
      } else if (code === 'USER_NOT_APPROVED') {
        setError('Seu cadastro está aguardando aprovação.');
      } else if (code === 'USER_REJECTED') {
        setError('Seu cadastro foi rejeitado. Entre em contato com o suporte.');
      } else if (code === 'USER_BLOCKED') {
        setError('Sua conta está bloqueada. Entre em contato com o suporte.');
      } else if (code === 401 || code === 'INVALID_CREDENTIALS') {
        setError('E-mail ou senha invalidos. Por favor, tente novamente.');
      } else if (code === 403) {
        setError('Sua conta esta bloqueada ou inativa. Entre em contato com o suporte.');
      } else {
        setError(
          err.message || `Falha ao fazer login (Erro: ${code}). Verifique suas credenciais.`
        );
      }
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setIsResending(true);
    setResendMessage(null);
    try {
      await resendConfirmation(email);
      setResendMessage('Se o e-mail existir, enviaremos um novo link de confirmação.');
    } catch (error: unknown) {
      const err = error as LoginError;
      const status = err.context?.status;
      const message = err.message || 'Nao foi possivel reenviar agora.';
      if (status === 429 || `${message}`.includes('[429]')) {
        setResendMessage('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      } else {
        setResendMessage('Não foi possível reenviar agora. Tente novamente em alguns minutos.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-5 pb-8 pt-5 custom-scrollbar sm:px-10 md:px-12 md:pt-7">
      <div className="mx-auto w-full max-w-[430px]">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Entrar</h2>
          <p className="mt-1 text-sm text-slate-600">Use seu e-mail ou uma conta social.</p>
        </div>
        <div className="mb-6 space-y-2.5">
          <Button
            variant="outline"
            className="h-11 w-full justify-center gap-3 rounded-md border-slate-200 font-medium text-slate-950 shadow-none hover:bg-slate-50 hover:text-slate-950"
            onClick={async () => {
              setError(null);
              try {
                await signInWithGoogle();
              } catch {
                setError('Falha ao iniciar login com Google.');
              }
            }}
            type="button"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar com Google
          </Button>

          <Button
            variant="outline"
            className="h-11 w-full justify-center gap-3 rounded-md border-slate-200 font-medium text-slate-950 shadow-none hover:bg-slate-50 hover:text-slate-950"
            onClick={async () => {
              setError(null);
              try {
                await signInWithLinkedIn();
              } catch {
                setError('Falha ao iniciar login com LinkedIn.');
              }
            }}
            type="button"
          >
            <svg className="w-5 h-5" fill="#0077b5" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
            Continuar com LinkedIn
          </Button>
        </div>
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500">ou</span>
          </div>
        </div>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {needsConfirmation && (
          <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-700" />
            <AlertDescription className="flex flex-col gap-3">
              <span>Confirme seu e-mail para liberar o acesso.</span>
              <Button
                type="button"
                variant="outline"
                className="w-full border-amber-300 bg-white hover:bg-amber-100 text-amber-900"
                onClick={handleResendConfirmation}
                disabled={isResending || !email}
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reenviando...
                  </>
                ) : (
                  'Reenviar confirmação'
                )}
              </Button>
              {resendMessage && <span className="text-sm">{resendMessage}</span>}
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 rounded-md border-slate-200 focus-visible:ring-blue-500/25"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline sm:text-sm"
              >
                Esqueceu sua senha?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-md border-slate-200 pr-10 focus-visible:ring-blue-500/25"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="mt-2 h-11 w-full rounded-md bg-blue-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
          <span>Não tem uma conta?</span>
          <button
            type="button"
            onClick={onCreateAccount}
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Criar conta
          </button>
        </div>
      </div>
    </div>
  );
}
