'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { leadsApiSafe } from '@/lib/api-client';
import Link from 'next/link';
import { Sun, Wallet, Leaf, ShieldCheck, MessageSquare, PhoneCall } from 'lucide-react';
import { track } from '@/lib/analytics/lazy';
import BannerByLocation from '@/components/BannerByLocation';

export default function ArticleConversionSection({ article }: { article: any }) {
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
    
    track('blog_lead_form_submit', {
      post_id: article?.id,
      post_title: article?.title,
      post_slug: article?.slug,
      category_name: article?.category?.name
    });

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
      track('blog_lead_form_success', {
        post_id: article?.id,
        post_title: article?.title,
        post_slug: article?.slug,
        category_name: article?.category?.name
      });
      track('blog_conversion', {
        conversion_type: 'lead_form',
        post_id: article?.id,
        post_title: article?.title,
        post_slug: article?.slug,
        category_name: article?.category?.name
      });
      setLead({
        name: '',
        email: '',
        phone: '',
        message: `Interesse em: ${article?.title || ''}`,
      });
    } catch {
      setStatus('error');
      track('blog_lead_form_error', {
        post_id: article?.id,
        post_title: article?.title,
        post_slug: article?.slug,
        category_name: article?.category?.name
      });
    }
  };

  return (
    <div className="my-12">
      {/* Monetization Block */}
      <div className="mb-8 rounded-xl overflow-hidden shadow-sm border border-slate-100 bg-slate-50/50">
        <BannerByLocation location="categories_top" limit={1} categoryId={article?.category_id} />
      </div>

      <section className="bg-slate-50 rounded-xl p-6 sm:p-8 border border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Avance para a energia solar</h2>
                {article?.category?.name && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{article.category.name}</Badge>
                )}
              </div>
              <p className="text-slate-600 leading-relaxed">
                Economize na conta de luz e aumente o valor do seu imóvel com painéis solares.
                Nossa equipe ajuda você a escolher a melhor empresa e financiamento.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
            <Link 
                href={article?.category?.seo_url ? `/categories/${article.category.seo_url}` : '/categories'} 
                className="flex-1"
                onClick={() => track('blog_cta_click', {
                  post_id: article?.id,
                  post_title: article?.title,
                  cta_text: 'Pedir orçamento',
                  cta_target: 'categories'
                })}
              >
                <Button className="w-full" variant="default">
                  <Sun className="w-4 h-4 mr-2" /> Pedir orçamento
                </Button>
              </Link>
              <Link 
                href="/simulador" 
                className="flex-1"
                onClick={() => track('blog_cta_click', {
                  post_id: article?.id,
                  post_title: article?.title,
                  cta_text: 'Simular economia',
                  cta_target: 'simulador'
                })}
              >
                <Button className="w-full" variant="outline">
                  <Wallet className="w-4 h-4 mr-2" /> Simular economia
                </Button>
              </Link>
            </div>
            
            <div className="pt-4 border-t border-slate-200">
               <h4 className="font-semibold text-sm text-slate-900 mb-3">Benefícios</h4>
               <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                 <li className="flex items-center"><Leaf className="w-4 h-4 mr-2 text-green-500"/> Energia limpa</li>
                 <li className="flex items-center"><Wallet className="w-4 h-4 mr-2 text-blue-500"/> Economia real</li>
                 <li className="flex items-center"><ShieldCheck className="w-4 h-4 mr-2 text-primary"/> Valoriza imóvel</li>
                 <li className="flex items-center"><Sun className="w-4 h-4 mr-2 text-amber-500"/> Sustentável</li>
               </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-primary"/>
              Solicite um contato
            </h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Input
                    placeholder="Seu nome"
                    value={lead.name}
                    onChange={(e) => setLead({ ...lead, name: e.target.value })}
                    required
                    className="bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                   <Input
                    placeholder="Seu email"
                    type="email"
                    value={lead.email}
                    onChange={(e) => setLead({ ...lead, email: e.target.value })}
                    required
                    className="bg-slate-50"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Input
                  placeholder="Seu telefone"
                  type="tel"
                  value={lead.phone}
                  onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                  required
                  className="bg-slate-50"
                />
              </div>
              <div className="space-y-1">
                <Textarea
                  placeholder="Como podemos ajudar?"
                  value={lead.message}
                  onChange={(e) => setLead({ ...lead, message: e.target.value })}
                  rows={3}
                  className="bg-slate-50 resize-none"
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={status === 'loading'}>
                {status === 'loading' ? 'Enviando...' : 'Enviar solicitação'}
              </Button>
              
              {status === 'success' && (
                <p className="text-sm text-green-600 text-center font-medium">Solicitação enviada com sucesso!</p>
              )}
              {status === 'error' && (
                <p className="text-sm text-red-600 text-center font-medium">Erro ao enviar. Tente novamente.</p>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
