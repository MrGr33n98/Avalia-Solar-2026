'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { usePageTracking } from '@/hooks/usePageTracking';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = useMemo(() => (params?.token ? String(params.token) : ''), [params]);

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  usePageTracking({
    type: 'auth',
    title: 'Redefinir senha - Avalia Solar',
  });

  const validatePassword = () => {
    if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
    if (password !== passwordConfirmation) return 'As senhas não conferem.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authApi.resetPassword(token, password, passwordConfirmation);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      const status = err?.context?.status;
      const message = err?.message || 'Não foi possível redefinir sua senha.';
      if (status === 422 || `${message}`.includes('[422]')) {
        setError('Token inválido ou expirado. Solicite um novo link de recuperação.');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-2xl p-8 space-y-6 border border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Redefinir senha</h1>
            <p className="text-slate-600 mt-1">Crie uma nova senha para acessar sua conta.</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Não foi possível redefinir</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-700">Senha atualizada</p>
              <p className="text-sm text-emerald-700/80">Redirecionando para o login...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite uma nova senha"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirmation">Confirmar senha</Label>
              <div className="relative">
                <Input
                  id="passwordConfirmation"
                  type={showConfirmation ? 'text' : 'password'}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Confirme a nova senha"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmation((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Atualizar senha'
              )}
            </Button>
          </form>
        )}

        <div className="text-sm text-slate-600 flex items-center justify-between">
          <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Voltar ao login
          </Link>
          <span className="text-slate-400">•</span>
          <Link href="/forgot-password" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Receber novo link
          </Link>
        </div>
      </div>
    </div>
  );
}
