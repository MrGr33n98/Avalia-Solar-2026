'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, MessageSquare, Send, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type OutreachTemplate = {
  id: string;
  title: string;
  category: 'whatsapp' | 'email';
  subject?: string;
  body: string;
};

export default function SalesOutreachTemplates({
  contactName = 'Carlos Mendes',
  companyName = 'Solar Tech Indústria',
  city = 'Cuiabá',
  phone = '(11) 98877-6655',
  repName = 'Consultor Avalia Solar',
}: {
  contactName?: string;
  companyName?: string;
  city?: string;
  phone?: string;
  repName?: string;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

  const templates: OutreachTemplate[] = [
    {
      id: 'wa-initial',
      title: '1. Abordagem Inicial B2B Solar',
      category: 'whatsapp',
      body: `Olá, ${contactName}! Tudo bem?\n\nSou o ${repName} do Avalia Solar. Notei que a ${companyName} é referência no setor fotovoltaico em ${city}.\n\nEstamos apresentando um modelo de qualificação de integradores e demanda B2B direta da região. Teria 5 minutos para conversarmos sobre a operação comercial de vocês nesta semana?`,
    },
    {
      id: 'wa-followup',
      title: '2. Follow-up de Diagnóstico & Fatura',
      category: 'whatsapp',
      body: `Olá, ${contactName}! Como vai?\n\nConseguiu analisar os dados de consumo em kWh e o perfil de clientes da ${companyName} que conversamos?\n\nMontei um relatório com as usinas disponíveis para atendimento imediato. Qual o melhor horário para um rápido alinhamento?`,
    },
    {
      id: 'wa-proposal',
      title: '3. Envio de Proposta Comercial',
      category: 'whatsapp',
      body: `Olá, ${contactName}!\n\nAcabei de finalizar a proposta personalizada para a ${companyName}.\n\nInclui o estudo de payback, condições exclusivas do Avalia Solar e a projeção de margem para o projeto. Podemos revisar juntos por aqui ou numa breve call de 10 minutos?`,
    },
    {
      id: 'email-proposal',
      title: '4. E-mail de Proposta Formal & Minuta',
      category: 'email',
      subject: `Proposta Comercial Avalia Solar — ${companyName}`,
      body: `Prezado(a) ${contactName},\n\nConforme nosso alinhamento, segue em anexo a proposta comercial desenvolvida especialmente para a ${companyName}.\n\nPrincipais destaques do acordo:\n- Atendimento prioritário de demanda de clientes em ${city}\n- Garantia de suporte técnico e qualificação de usinas\n- Condições de faturamento e parcelamento especial\n\nFico à disposição para sanar eventuais dúvidas com o time de engenharia e diretoria.\n\nAtenciosamente,\n${repName} | Avalia Solar`,
    },
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openWhatsAppLink = (body: string) => {
    const encoded = encodeURIComponent(body);
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-blue-300 bg-blue-50/50 text-blue-900 hover:bg-blue-100">
          <MessageSquare className="mr-1.5 h-3.5 w-3.5 text-blue-800" /> Script / Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge className="border-0 bg-blue-900 font-bold text-white">Avalia Solar Sales Script</Badge>
            <span className="text-xs text-slate-500 font-medium">Templates de Alta Conversão B2B</span>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Modelos de Mensagem para {companyName}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Mensagens pré-configuradas e personalizadas com os dados de <strong>{contactName}</strong> ({city}).
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="whatsapp" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1">
            <TabsTrigger value="whatsapp" className="data-[state=active]:bg-white data-[state=active]:font-bold">
              WhatsApp Sales Scripts
            </TabsTrigger>
            <TabsTrigger value="email" className="data-[state=active]:bg-white data-[state=active]:font-bold">
              E-mail Proposals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="whatsapp" className="space-y-4 mt-4">
            {templates
              .filter((t) => t.category === 'whatsapp')
              .map((t) => (
                <div key={t.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">{t.title}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(t.id, t.body)}
                        className="h-8 border-slate-300 bg-white text-xs hover:bg-slate-50"
                      >
                        {copiedId === t.id ? (
                          <>
                            <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1 h-3.5 w-3.5 text-slate-600" /> Copiar
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openWhatsAppLink(t.body)}
                        className="h-8 bg-emerald-600 font-bold text-white hover:bg-emerald-700 text-xs"
                      >
                        <Send className="mr-1 h-3.5 w-3.5" /> Enviar WhatsApp
                      </Button>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap rounded border border-slate-200 bg-white p-3 text-xs text-slate-700 font-sans leading-relaxed">
                    {t.body}
                  </pre>
                </div>
              ))}
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-4">
            {templates
              .filter((t) => t.category === 'email')
              .map((t) => (
                <div key={t.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t.title}</p>
                      {t.subject && (
                        <p className="text-xs font-semibold text-blue-900 mt-0.5">Assunto: {t.subject}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(t.id, `Assunto: ${t.subject}\n\n${t.body}`)}
                      className="h-8 border-slate-300 bg-white text-xs hover:bg-slate-50"
                    >
                      {copiedId === t.id ? (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3.5 w-3.5 text-slate-600" /> Copiar Texto
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="whitespace-pre-wrap rounded border border-slate-200 bg-white p-3 text-xs text-slate-700 font-sans leading-relaxed">
                    {t.body}
                  </pre>
                </div>
              ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
