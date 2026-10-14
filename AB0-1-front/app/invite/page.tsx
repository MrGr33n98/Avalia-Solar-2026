'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  LogIn,
  Loader2,
  Mail,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { companyTeamApi, hasPossibleAuthSession } from '@/lib/api';
import { BrandLogo } from '@/components/brand/BrandLogo';

interface InvitationDetails {
  company_id: number;
  company_name: string;
  email: string;
  role: string;
  expires_at: string;
}

export default function InviteAcceptPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [token, setToken] = useState<string | null>(null);
  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    // 1. Extrair token do hash fragment (#token=xyz) prioritariamente ou query param (?token=xyz)
    let extractedToken: string | null = null;
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const hashMatch = hash.match(/token=([^&]+)/);
      if (hashMatch) {
        extractedToken = decodeURIComponent(hashMatch[1]);
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        extractedToken = searchParams.get('token');
      }
    }

    if (!extractedToken) {
      setLoading(false);
      setError('Nenhum token de convite fornecido.');
      return;
    }

    setToken(extractedToken);

    // 2. Verificar convite
    companyTeamApi
      .verifyInvitation(extractedToken)
      .then((data) => {
        setDetails(data);
        setError(null);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error
            ? err.message
            : 'Este convite é inválido, foi revogado ou já expirou.';
        setError(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      await companyTeamApi.acceptInvitation(token);
      setAccepted(true);
      toast({
        title: 'Convite aceito com sucesso!',
        description: 'Você já faz parte da equipe. Redirecionando para o painel...',
      });
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao aceitar o convite.';
      toast({
        title: 'Não foi possível aceitar',
        description: msg,
        variant: 'destructive',
      });
      setAccepting(false);
    }
  };

  const isLoggedIn = hasPossibleAuthSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background flex flex-col justify-center items-center p-4">
      <div className="mb-8">
        <BrandLogo className="h-9" sizes="160px" priority />
      </div>

      <Card className="w-full max-w-md shadow-xl border-border/60 bg-card/90 backdrop-blur-md">
        <CardHeader className="text-center pb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            Convite para Equipe Corporativa
          </CardTitle>
          <CardDescription className="text-xs">
            Você foi convidado a gerenciar um perfil empresarial no Avalia Solar.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Verificando autenticidade do convite...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center space-y-2">
              <AlertTriangle className="w-6 h-6 text-destructive mx-auto" />
              <div className="font-semibold text-xs text-destructive">Convite Indisponível</div>
              <p className="text-[11px] text-muted-foreground">{error}</p>
            </div>
          ) : details ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/40 border border-border/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Empresa:</span>
                  <span className="font-bold text-sm text-foreground">{details.company_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">E-mail:</span>
                  <span className="font-mono text-xs text-foreground">{details.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Papel Atribuído:</span>
                  <Badge variant="outline" className="text-xs capitalize font-semibold bg-primary/10 text-primary border-primary/20">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    {details.role}
                  </Badge>
                </div>
              </div>

              {!isLoggedIn && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>Você precisa estar conectado à sua conta para aceitar o convite.</span>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-2">
          {error ? (
            <Button asChild variant="outline" className="w-full text-xs">
              <Link href="/login">Ir para a página de Login</Link>
            </Button>
          ) : accepted ? (
            <Button disabled className="w-full text-xs bg-emerald-600">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Convite Aceito! Entrando...
            </Button>
          ) : details && isLoggedIn ? (
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full text-xs font-semibold h-10 shadow-md"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Vinculando conta à empresa...
                </>
              ) : (
                <>
                  Aceitar Convite e Acessar Empresa
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          ) : details && !isLoggedIn ? (
            <div className="w-full space-y-2">
              <Button asChild className="w-full text-xs">
                <Link href={`/login?returnTo=/invite#token=${token}`}>
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Entrar com minha conta
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full text-xs">
                <Link href={`/signup?email=${encodeURIComponent(details?.email || '')}&returnTo=/invite#token=${token}`}>
                  Criar uma nova conta
                </Link>
              </Button>
            </div>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
}
