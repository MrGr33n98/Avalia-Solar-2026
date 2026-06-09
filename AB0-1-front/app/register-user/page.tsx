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

import { Shield, BarChart3, CheckCircle2, Lock, Star, User, Mail, Calendar, KeyRound } from 'lucide-react';
import Image from 'next/image';

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
  const rawReturnTo = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const sp = new URLSearchParams(window.location.search);
    return sp.get('return_to');
  }, []);
  const safeReturnTo = rawReturnTo && rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//')
    ? rawReturnTo
    : null;
  const returnToQuery = safeReturnTo ? `?return_to=${encodeURIComponent(safeReturnTo)}` : '';

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
      const resp: any = await authApi.signup({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        date_of_birth: dateOfBirth,
        terms_accepted: true,
      });
      setSubmitted(true);
      if (safeReturnTo) {
        setTimeout(() => {
          window.location.href = safeReturnTo;
        }, 800);
        return;
      }
    } catch (err: any) {
      setError(err?.message || 'Falha no cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Imagem de Fundo (opcional/decorativa) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden lg:block opacity-10">
        <Image
          src="/pricing-hero-solar-bg.jpg"
          alt="Solar Panels Background"
          fill
          className="object-cover object-left"
          priority
        />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
        
        {/* Coluna da Esquerda - Benefícios */}
        <div className="hidden lg:flex flex-col space-y-10 pl-4 xl:pl-8">
          <div className="space-y-4 max-w-lg">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wider">
              Junte-se à Avalia Solar
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold text-slate-900 leading-tight">
              Crie sua conta e acesse <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">recursos exclusivos</span>
            </h1>
            <p className="text-slate-600 text-lg">
              Compare empresas verificadas, receba orçamentos personalizados e tome decisões com mais confiança e segurança.
            </p>
          </div>

          <div className="space-y-4 max-w-lg">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white shadow-sm border border-slate-100 transition-transform hover:-translate-y-1">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Acesso a orçamentos gratuitos</h3>
                <p className="text-sm text-slate-500">Receba até 4 orçamentos de empresas verificadas.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white shadow-sm border border-slate-100 transition-transform hover:-translate-y-1">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Comparação inteligente</h3>
                <p className="text-sm text-slate-500">Compare preços, avaliações e soluções lado a lado.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white shadow-sm border border-slate-100 transition-transform hover:-translate-y-1">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Empresas verificadas</h3>
                <p className="text-sm text-slate-500">Trabalhamos apenas com parceiros confiáveis.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white shadow-sm border border-slate-100 transition-transform hover:-translate-y-1">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                <Lock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Seus dados protegidos</h3>
                <p className="text-sm text-slate-500">Privacidade e segurança são nossa prioridade.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-8">
            <div className="flex -space-x-3">
              <img className="w-10 h-10 rounded-full border-2 border-slate-50 shadow-sm" src="https://i.pravatar.cc/150?u=1" alt="Usuário 1" />
              <img className="w-10 h-10 rounded-full border-2 border-slate-50 shadow-sm" src="https://i.pravatar.cc/150?u=2" alt="Usuário 2" />
              <img className="w-10 h-10 rounded-full border-2 border-slate-50 shadow-sm" src="https://i.pravatar.cc/150?u=3" alt="Usuário 3" />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-700">Mais de 10.000 usuários já confiam na Avalia Solar</p>
              <div className="flex items-center gap-1">
                <div className="flex text-amber-400">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <span className="text-xs text-slate-500 ml-1 font-medium">4.9/5 em avaliações</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna da Direita - Formulário */}
        <div className="w-full flex justify-center lg:justify-end">
          <Card className="w-full max-w-md border-0 shadow-2xl shadow-blue-900/5 bg-white/95 backdrop-blur-sm rounded-2xl">
            <CardHeader className="pb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 mx-auto text-blue-600">
                <User className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-bold text-center text-slate-900">Cadastro de Usuário</CardTitle>
              <CardDescription className="text-center text-slate-500">
                Crie sua conta para acessar recursos da plataforma
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2" role="alert">
                  <CheckCircle2 className="w-5 h-5 text-red-600 flex-shrink-0" />
                  {error}
                </div>
              )}

              {submitted ? (
                <div className="space-y-6">
                  <div className="p-5 bg-green-50 text-green-800 rounded-xl text-sm border border-green-100 text-center font-medium">
                    Cadastro enviado com sucesso. Verifique seu e-mail para confirmar sua conta.
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-base font-semibold transition-all shadow-sm shadow-blue-600/20" onClick={() => router.push(`/login${returnToQuery}`)}>
                    Ir para Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-slate-700 font-semibold text-sm">Nome completo *</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="h-5 w-5" />
                      </div>
                      <Input 
                        id="name" 
                        type="text" 
                        placeholder="Digite seu nome completo"
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                        aria-required="true" 
                        className="pl-10 rounded-xl h-12 border-slate-200 bg-slate-50/50 focus:bg-white transition-colors" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-slate-700 font-semibold text-sm">E-mail *</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-5 w-5" />
                      </div>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="seu@email.com"
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        aria-required="true" 
                        className="pl-10 rounded-xl h-12 border-slate-200 bg-slate-50/50 focus:bg-white transition-colors" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-slate-700 font-semibold text-sm">Senha *</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="h-5 w-5" />
                      </div>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••"
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        aria-required="true" 
                        className="pl-10 rounded-xl h-12 border-slate-200 bg-slate-50/50 focus:bg-white transition-colors" 
                      />
                    </div>
                    {password && (
                      <div className="pt-2 px-1">
                        <Progress value={passwordScore} className="h-1.5 bg-slate-100" />
                        <p className={`text-[11px] font-medium mt-1.5 ${passwordScore >= 100 ? 'text-green-600' : 'text-slate-500'}`}>
                          {passwordScore >= 100 ? 'Senha forte!' : 'Mínimo: 8 caracteres, maiúscula, minúscula, número'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password_confirmation" className="text-slate-700 font-semibold text-sm">Confirmar senha *</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="h-5 w-5" />
                      </div>
                      <Input 
                        id="password_confirmation" 
                        type="password" 
                        placeholder="Confirme sua senha"
                        value={passwordConfirmation} 
                        onChange={(e) => setPasswordConfirmation(e.target.value)} 
                        required 
                        aria-required="true" 
                        className="pl-10 rounded-xl h-12 border-slate-200 bg-slate-50/50 focus:bg-white transition-colors" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dob" className="text-slate-700 font-semibold text-sm">Data de nascimento *</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <Input 
                        id="dob" 
                        type="date" 
                        value={dateOfBirth} 
                        onChange={(e) => setDateOfBirth(e.target.value)} 
                        required 
                        aria-required="true" 
                        className="pl-10 rounded-xl h-12 border-slate-200 bg-slate-50/50 focus:bg-white transition-colors text-slate-700" 
                      />
                    </div>
                    {!isAdult && dateOfBirth && (<p className="text-xs font-medium text-red-600 mt-1 px-1">É necessário ser maior de 18 anos</p>)}
                  </div>

                  <div className="flex items-start gap-3 pt-2 pb-1">
                    <Checkbox id="terms" checked={terms} onCheckedChange={(v: any) => setTerms(Boolean(v))} aria-required="true" className="mt-1 rounded border-slate-300 text-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                    <Label htmlFor="terms" className="text-sm leading-snug text-slate-600 font-medium cursor-pointer">
                      Aceito os <Link href="/terms" className="text-blue-600 hover:text-blue-700 hover:underline">Termos de Uso</Link> e a <Link href="/terms" className="text-blue-600 hover:text-blue-700 hover:underline">Política de Privacidade</Link>
                    </Label>
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-base font-semibold transition-all shadow-sm shadow-blue-600/20 mt-2" disabled={isLoading} aria-busy={isLoading}>
                    {isLoading ? 'Cadastrando...' : 'Cadastrar'}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pb-8 pt-2">
              <div className="w-full border-t border-slate-100 pt-6">
                <p className="text-sm text-center text-slate-600 font-medium">
                  Já possui conta? <Link href={`/login${returnToQuery}`} className="text-blue-600 hover:text-blue-700 hover:underline">Acesse aqui</Link>
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
