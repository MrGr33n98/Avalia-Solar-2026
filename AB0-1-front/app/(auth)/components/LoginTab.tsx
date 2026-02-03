'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
export default function LoginTab() {
  const { login, signInWithLinkedIn, resendConfirmation } = useAuth();
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
      setError('Sua sessao expirou. Por favor, faca login novamente.');
    } else if (errorCode === 'unauthorized') {
      setError('Voce nao tem permissao para acessar esta pagina.');
    }
  }, [searchParams]);

  const rawReturnTo = searchParams.get('return_to') || searchParams.get('redirect');
  const safeReturnTo =
    rawReturnTo && rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//') ? rawReturnTo : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setNeedsConfirmation(false);
    setResendMessage(null);
    try {
      console.log('[LoginTab] Starting login for:', email);
      await login(email, password);
      
      const redirect = safeReturnTo || '/dashboard';
      console.log('[LoginTab] Login successful, redirecting to:', redirect);
      
      // Delay briefly to allow cookies and context state to settle
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Use router.push for a smoother SPA transition if it's an internal route,
      // but fallback to window.location.href if the loop persists.
      try {
        router.push(redirect);
      } catch (e) {
        console.warn('[LoginTab] router.push failed, falling back to window.location.href');
        window.location.href = redirect;
      }
    } catch (err: any) {
      console.error('[LoginTab] Login error:', err);
      const code = err?.context?.details?.code || err?.status || 'UNKNOWN';
      
      if (code === 'EMAIL_NOT_CONFIRMED' || (err?.message && err.message.includes('confirm seu e-mail'))) {
        setNeedsConfirmation(true);
        setError('Seu e-mail ainda nao foi confirmado. Verifique sua caixa de entrada ou reenvie o link.');
      } else if (code === 401 || code === 'INVALID_CREDENTIALS') {
        setError('E-mail ou senha invalidos. Por favor, tente novamente.');
      } else if (code === 403) {
        setError('Sua conta esta bloqueada ou inativa. Entre em contato com o suporte.');
      } else {
        setError(err?.message || `Falha ao fazer login (Erro: ${code}). Verifique suas credenciais.`);
      }
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setIsResending(true);
    setResendMessage(null);
    try {
      await resendConfirmation(email);
      setResendMessage('Se o e-mail existir, enviaremos um novo link de confirmacao.');
    } catch (err: any) {
      const status = err?.context?.status;
      const message = err?.message || 'Nao foi possivel reenviar agora.';
      if (status === 429 || `${message}`.includes('[429]')) {
        setResendMessage('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      } else {
        setResendMessage('Nao foi possivel reenviar agora. Tente novamente em alguns minutos.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col h-full justify-center p-8 lg:p-12 overflow-y-auto custom-scrollbar">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Entrar</h2>
        <p className="text-slate-600">Bem-vindo de volta! Acesse sua conta.</p>
      </div>
      <div className="space-y-3 mb-6">
        <Button
          variant="outline"
          className="w-full h-11 border-slate-200 hover:bg-slate-50 hover:text-slate-900 justify-center gap-2 font-medium"
          onClick={() => console.log('Google Sign-in clicked')}
          type="button"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continuar com Google
        </Button>
        <Button
          variant="outline"
          className="w-full h-11 border-slate-200 hover:bg-slate-50 hover:text-slate-900 justify-center gap-2 font-medium"
          onClick={() => signInWithLinkedIn()}
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
                'Reenviar confirmacao'
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
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border-slate-200 focus:ring-emerald-500/20"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link href="/forgot-password" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
              Esqueceu sua senha?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-slate-200 focus:ring-emerald-500/20 pr-10"
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
        <div className="flex items-center space-x-2">
          <Checkbox id="remember" />
          <label
            htmlFor="remember"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
          >
            Lembrar-me
          </label>
        </div>
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-2"
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
    </div>
  );
}
