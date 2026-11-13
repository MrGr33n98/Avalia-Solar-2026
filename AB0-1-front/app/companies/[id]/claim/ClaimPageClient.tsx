'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Loader2,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { companyAccessApi, getErrorStatus } from '@/lib/api';

type ClaimCompany = {
  id: number;
  name: string;
  city?: string | null;
  state?: string | null;
  logo_url?: string | null;
};

export default function ClaimPageClient({
  company,
  companyId,
}: {
  company: ClaimCompany;
  companyId: string;
}) {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const returnTo = `/companies/${encodeURIComponent(companyId)}/claim`;
      router.replace(`/login?return_to=${encodeURIComponent(returnTo)}`);
    }
  }, [authLoading, companyId, isAuthenticated, router]);

  useEffect(() => {
    if (user?.email) setContactEmail((current) => current || user.email);
  }, [user?.email]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || submitting) return;

    setError('');
    setSubmitting(true);
    try {
      await companyAccessApi.createRequest(company.id, message.trim() || undefined, {
        contact_email: contactEmail.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
      });
      setSubmitted(true);
    } catch (requestError) {
      const status = getErrorStatus(requestError);
      if (status === 401) {
        const returnTo = `/companies/${encodeURIComponent(companyId)}/claim`;
        router.replace(`/login?return_to=${encodeURIComponent(returnTo)}`);
      } else if (status === 403) {
        setError('Sua conta ainda não pode solicitar acesso a um perfil de empresa.');
      } else if (status === 404) {
        setError('Este perfil não está disponível para reivindicação.');
      } else if (status === 409) {
        setError('Você já tem uma solicitação ou acesso para este perfil.');
      } else if (status === 422) {
        setError('Confira os dados de contato e tente novamente.');
      } else {
        setError('Não foi possível enviar agora. Confira sua conexão e tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center text-muted-foreground" role="status">
        Preparando sua solicitação…
      </div>
    );
  }

  if (submitted) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-20">
        <Card className="border-emerald-200 shadow-sm">
          <CardContent className="space-y-6 px-6 py-10 text-center sm:px-10">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" aria-hidden="true" />
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Solicitação enviada</h1>
              <p className="text-muted-foreground">
                O pedido para gerenciar <strong>{company.name}</strong> está pendente de análise. O
                envio não concede acesso ao perfil.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(`/companies/${encodeURIComponent(companyId)}`)}
            >
              Voltar ao perfil
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const location = [company.city, company.state].filter(Boolean).join(' · ');
  const whatsappUrl = `https://wa.me/5565993465055?text=${encodeURIComponent(`Olá, preciso de ajuda com a solicitação de acesso ao perfil ${company.name}.`)}`;

  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Button asChild variant="ghost" className="mb-5 -ml-3">
        <a href={`/companies/${encodeURIComponent(companyId)}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao perfil
        </a>
      </Button>

      <header className="mb-8 max-w-2xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" /> Acesso ao perfil da empresa
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Solicite acesso para gerenciar este perfil
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Envie seus dados para análise da equipe Avalia Solar. A solicitação fica pendente até a
          revisão; nenhuma permissão é liberada automaticamente.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Seus dados de contato</CardTitle>
            <CardDescription>
              Informe como a equipe pode falar com você sobre este pedido. Os contatos são opcionais
              e não alteram o e-mail da sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="claim-account-email">E-mail da conta</Label>
                <Input
                  id="claim-account-email"
                  value={user?.email || ''}
                  readOnly
                  aria-describedby="claim-account-note"
                />
                <p id="claim-account-note" className="text-xs text-muted-foreground">
                  Usado para identificar sua conta. Não será alterado.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="claim-contact-email">
                  E-mail para contato{' '}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="claim-contact-email"
                  type="email"
                  autoComplete="email"
                  maxLength={255}
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claim-contact-phone">
                  Telefone ou WhatsApp{' '}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="claim-contact-phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={24}
                  placeholder="+55 (65) 99999-9999"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claim-message">
                  Mensagem <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Textarea
                  id="claim-message"
                  maxLength={2000}
                  placeholder="Conte brevemente sua relação com a empresa."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                />
              </div>
              {error && (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…
                  </>
                ) : (
                  <>
                    Enviar solicitação <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Não é necessário anexar documentos nesta etapa. O envio não confirma propriedade nem
                concede acesso.
              </p>
            </form>
          </CardContent>
        </Card>

        <aside className="space-y-5">
          <Card className="overflow-hidden shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Perfil solicitado</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div
                className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted"
                aria-label={`Marca de ${company.name}`}
              >
                {company.logo_url ? (
                  <Image
                    src={company.logo_url}
                    alt={`Logo de ${company.name}`}
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                    unoptimized
                  />
                ) : (
                  <BriefcaseBusiness className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{company.name}</h2>
                {location && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {location}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/15 bg-primary/[0.03] shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" /> O que acontece
                depois?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                A equipe revisa a solicitação e pode entrar em contato para confirmar o vínculo com
                a empresa.
              </p>
              <p>
                O perfil só poderá ser gerenciado depois da aprovação. Esta solicitação não concede
                selo de verificação nem altera o plano da empresa.
              </p>
            </CardContent>
          </Card>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 py-3 text-center text-sm font-semibold text-[#073b20] transition-colors hover:bg-[#1fbd5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128C7E] focus-visible:ring-offset-2"
          >
            <Image
              src="/images/email/whatsapp.png"
              alt=""
              width={20}
              height={20}
              aria-hidden="true"
            />
            Precisa de ajuda? Fale pelo WhatsApp
          </a>
        </aside>
      </div>
    </main>
  );
}
