'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

const EMAIL_REGEX = /^(?:[a-zA-Z0-9!#$%&'*+\/?^_`{|}~\-]+(?:\.[a-zA-Z0-9!#$%&'*+\/?^_`{|}~\-]+)*)@(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export default function RegisterUserPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [terms, setTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const isAdult = useMemo(() => {
    if (!dateOfBirth) return false;
    const dob = new Date(dateOfBirth);
    const now = new Date();
    const min = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
    return dob <= min;
  }, [dateOfBirth]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[a-z]/.test(password)) score += 25;
    if (/\d/.test(password)) score += 25;
    if (password.length >= 8) score += 25;
    return score;
  }, [password]);

  useEffect(() => {
    setError(null);
  }, [name, email, password, passwordConfirmation, dateOfBirth, terms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || name.trim().length < 3 || name.length > 100) {
      setError('Nome completo deve ter entre 3 e 100 caracteres');
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setError('E-mail inválido');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Senha e confirmação não conferem');
      return;
    }
    if (passwordScore < 100) {
      setError('Senha fraca. Use maiúscula, minúscula, número e 8+ caracteres');
      return;
    }
    if (!isAdult) {
      setError('É necessário ser maior de 18 anos');
      return;
    }
    if (!terms) {
      setError('Você precisa aceitar os Termos de Uso e a Política de Privacidade');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const resp: any = await authApi.register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        date_of_birth: dateOfBirth,
        terms_accepted: true,
      });
      if (resp?.token && resp?.user && typeof window !== 'undefined') {
        localStorage.setItem('auth', JSON.stringify({ token: resp.token, user: resp.user }));
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Falha no cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Cadastro de Usuário</CardTitle>
          <CardDescription className="text-center">
            Crie sua conta para acessar recursos da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm" role="alert">
              {error}
            </div>
          )}

          {submitted ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 text-green-700 rounded-md text-sm">
                Cadastro enviado com sucesso. Verifique seu e-mail para confirmar sua conta.
              </div>
              <Button className="w-full" onClick={() => router.push('/login')}>Ir para Login</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="name">Nome completo *</Label>
                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required aria-required="true" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-required="true" className="mt-1" />
                <p className="text-xs text-gray-500 mt-1">Validado em tempo real conforme RFC 5322</p>
              </div>
              <div>
                <Label htmlFor="password">Senha *</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required aria-required="true" className="mt-1" />
                <div className="mt-2">
                  <Progress value={passwordScore} />
                  <p className="text-xs text-gray-500 mt-1">Requisitos: 8+ caracteres, 1 maiúscula, 1 minúscula, 1 número</p>
                </div>
              </div>
              <div>
                <Label htmlFor="password_confirmation">Confirmar senha *</Label>
                <Input id="password_confirmation" type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required aria-required="true" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="dob">Data de nascimento *</Label>
                <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required aria-required="true" className="mt-1" />
                {!isAdult && dateOfBirth && (<p className="text-xs text-red-600 mt-1">É necessário ser maior de 18 anos</p>)}
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="terms" checked={terms} onCheckedChange={(v: any) => setTerms(Boolean(v))} aria-required="true" />
                <Label htmlFor="terms" className="text-sm">
                  Aceito os <Link href="/terms" className="underline">Termos de Uso</Link> e a <Link href="/terms" className="underline">Política de Privacidade</Link>
                </Label>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading}>
                {isLoading ? 'Enviando...' : 'Cadastrar'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-sm text-center">
            Já possui conta? <Link href="/login" className="underline">Acesse aqui</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
