'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePageTracking } from '@/hooks/usePageTracking';

function ForgotPasswordContent() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  usePageTracking({
    type: 'auth',
    title: 'Esqueci minha senha - Avalia Solar',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      const status = err?.context?.status;
      const message = err?.message || 'Não foi possível enviar o e-mail de recuperação.';
      if (status === 422 || `${message}`.includes('[422]')) {
        setError('Verifique o e-mail informado e tente novamente.');
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
            <h1 className="text-2xl font-bold text-slate-900">Recuperar senha</h1>
            <p className="text-slate-600 mt-1">Digite seu e-mail para receber o link de redefinição.</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Mail className="h-5 w-5" />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Não foi possível enviar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-700">E-mail enviado</p>
              <p className="text-sm text-emerald-700/80">
                Se o e-mail existir na nossa base, você receberá instruções para redefinir a senha.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar link'
              )}
            </Button>
          </form>
        )}

        <div className="text-sm text-slate-600 flex items-center justify-between">
          <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Voltar ao login
          </Link>
          <span className="text-slate-400">•</span>
          <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-600">Carregando...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
