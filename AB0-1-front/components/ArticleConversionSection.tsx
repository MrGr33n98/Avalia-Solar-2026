'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useBanners } from '@/hooks/useBanners';
import { useBannerGlobal } from '@/hooks/useBannerGlobal';
import { leadsApiSafe } from '@/lib/api-client';
import { getFullImageUrl } from '@/utils/image';
import Link from 'next/link';
import { Sun, Wallet, Leaf, ShieldCheck, MessageSquare, PhoneCall } from 'lucide-react';

export default function ArticleConversionSection({ article }: { article: any }) {
  const { banners } = useBanners();
  const { bannerGlobal } = useBannerGlobal();

  const [lead, setLead] = useState({
    name: '',
    email: '',
    phone: '',
    message: `Interesse em: ${article?.title || ''}`,
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await leadsApiSafe.create({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        message: lead.message,
        category_id: article?.category_id,
        company_id: article?.company_id,
      });
      setStatus('success');
      setLead({
        name: '',
        email: '',
        phone: '',
        message: `Interesse em: ${article?.title || ''}`,
      });
    } catch {
      setStatus('error');
    }
  };

  const sponsoredBanners = (banners || []).filter(b => b.sponsored);
  const sidebarBanners = (banners || []).filter(b => b.position === 'sidebar');

  return (
    <section className="mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Avance para a energia solar</h2>
              {article?.category?.name && (
                <Badge variant="secondary">{article.category.name}</Badge>
              )}
            </div>
            <p className="text-gray-600">
              Economize na conta de luz e aumente o valor do seu imóvel com painéis solares.
              Nossa equipe ajuda você a escolher a melhor empresa e financiamento.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link href={article?.category?.slug ? `/categories/${article.category.slug}` : '/categories'}>
                <Button className="w-full" variant="default">
                  <Sun className="w-4 h-4 mr-2" /> Pedir orçamento
                </Button>
              </Link>
              <Link href="/contact">
                <Button className="w-full" variant="secondary">
                  <PhoneCall className="w-4 h-4 mr-2" /> Falar com especialista
                </Button>
              </Link>
              <Link href="/simulador">
                <Button className="w-full" variant="outline">
                  <Wallet className="w-4 h-4 mr-2" /> Simular economia
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Solicite um contato</h3>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
              <div className="md:col-span-1">
                <Input
                  placeholder="Seu nome"
                  value={lead.name}
                  onChange={(e) => setLead({ ...lead, name: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-1">
                <Input
                  type="email"
                  placeholder="Seu e-mail"
                  value={lead.email}
                  onChange={(e) => setLead({ ...lead, email: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-1">
                <Input
                  placeholder="Seu telefone"
                  value={lead.phone}
                  onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  placeholder="Mensagem (opcional)"
                  value={lead.message}
                  onChange={(e) => setLead({ ...lead, message: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="w-full" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Enviando...' : 'Enviar'}
                </Button>
                {status === 'success' && (
                  <p className="text-green-600 text-sm mt-2">Recebemos sua solicitação. Entraremos em contato.</p>
                )}
                {status === 'error' && (
                  <p className="text-red-600 text-sm mt-2">Não foi possível enviar. Tente novamente.</p>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Benefícios dos painéis solares</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Sun className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-semibold">Energia limpa e renovável</p>
                  <p className="text-gray-600 text-sm">Reduza emissões e contribua com o meio ambiente.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Wallet className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-semibold">Economia real</p>
                  <p className="text-gray-600 text-sm">Diminua sua conta de luz com retorno previsível.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Leaf className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-semibold">Valorização do imóvel</p>
                  <p className="text-gray-600 text-sm">Maior atratividade e valor de mercado.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-semibold">Garantias e suporte</p>
                  <p className="text-gray-600 text-sm">Empresas avaliadas com garantia de instalação.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Depoimentos</h3>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-gray-800">
                  <MessageSquare className="w-4 h-4" /> Excelente atendimento e instalação rápida.
                </div>
                <p className="text-sm text-gray-500 mt-1">Cliente verificado</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-gray-800">
                  <MessageSquare className="w-4 h-4" /> Já vimos a economia na primeira fatura.
                </div>
                <p className="text-sm text-gray-500 mt-1">Cliente verificado</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-8">
          {bannerGlobal?.image_url && (
            <a
              href={bannerGlobal.link || '#'}
              target={bannerGlobal.link ? '_blank' : undefined}
              rel={bannerGlobal.link ? 'noopener noreferrer' : undefined}
              className="block"
            >
              <img
                src={getFullImageUrl(bannerGlobal.image_url) || ''}
                alt={bannerGlobal.title || 'Patrocínio'}
                className="w-full h-40 object-cover rounded-lg"
              />
            </a>
          )}

          {sponsoredBanners.length > 0 && (
            <div className="space-y-4">
              {sponsoredBanners.map(b => (
                <a
                  key={b.id}
                  href={b.link || '#'}
                  target={b.link ? '_blank' : undefined}
                  rel={b.link ? 'noopener noreferrer' : undefined}
                  className="block"
                >
                  <img
                    src={getFullImageUrl(b.image_url) || ''}
                    alt={b.title || 'Patrocínio'}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                </a>
              ))}
            </div>
          )}

          {sidebarBanners.length > 0 && (
            <div className="space-y-4">
              {sidebarBanners.map(b => (
                <a
                  key={b.id}
                  href={b.link || '#'}
                  target={b.link ? '_blank' : undefined}
                  rel={b.link ? 'noopener noreferrer' : undefined}
                  className="block"
                >
                  <img
                    src={getFullImageUrl(b.image_url) || ''}
                    alt={b.title || 'Publicidade'}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                </a>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}