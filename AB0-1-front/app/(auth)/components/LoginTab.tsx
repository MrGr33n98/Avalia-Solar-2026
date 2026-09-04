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

import { resolveSurfaceFromHost, getSurfaceInfo } from '@/lib/host-context';

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

  const [surfaceInfo, setSurfaceInfo] = useState(() =>
    getSurfaceInfo(resolveSurfaceFromHost(typeof window !== 'undefined' ? window.location.host : ''))
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSurfaceInfo(getSurfaceInfo(resolveSurfaceFromHost(window.location.host)));
    }
  }, []);

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
      const destination = await getPostLoginDestination(authenticatedUser, safeReturnTo, surfaceInfo.surface);
      if (typeof window !== 'undefined' && new URL(destination, window.location.href).origin !== window.location.origin) {
        window.location.assign(destination);
      } else {
        router.push(destination);
      }
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
          <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-100 mb-2">
            {surfaceInfo.displayName}
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">{surfaceInfo.loginTitle}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {surfaceInfo.isCrm
              ? 'Acesso exclusivo à equipe e consultores Avalia Solar.'
              : 'Use seu e-mail ou uma conta social.'}
          </p>
        </div>
        {!surfaceInfo.isCrm && (
          <>
            <div className="mb-6 space-y-2.5">
              <Button variant="outline" className="h-11 w-full justify-center gap-3 rounded-md border-slate-200 font-medium text-slate-950 shadow-none hover:bg-slate-50" onClick={async () => { setError(null); try { await signInWithGoogle(); } catch { setError("Falha ao iniciar login com Google."); } }} type="button">
                <span aria-hidden="true" className="text-base font-bold text-blue-600">G</span>
                Continuar com Google
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
          </>
        )}
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
        {!surfaceInfo.isCrm && (
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
        )}
      </div>
    </div>
  );
}
