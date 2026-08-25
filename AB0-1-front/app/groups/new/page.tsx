'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Shield, Eye, Lock, Globe, Users, PenTool, CheckCircle2 } from 'lucide-react';
import { createGroup } from '@/lib/api/groups';
import { fetchApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

type StepType = 'identity' | 'settings' | 'review';

export default function NewGroupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<StepType>('identity');

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [visibility, setVisibility] = useState('public');
  const [membershipMode, setMembershipMode] = useState('open');
  const [postingMode, setPostingMode] = useState('anyone');

  // Load categories list for select dropdown
  const { data: categories } = useQuery({
    queryKey: ['categories-list'],
    queryFn: async () => {
      const resp = await fetchApi<unknown>('/categories', {
        params: { view: 'cards', limit: 200 },
      });
      if (Array.isArray(resp)) return resp;
      if (resp && typeof resp === 'object') {
        const data = (resp as Record<string, unknown>).data;
        if (Array.isArray(data)) return data;
        const categories = (resp as Record<string, unknown>).categories;
        if (Array.isArray(categories)) return categories;
      }
      return [];
    },
  });

  // Auto-generate slug from name if not manually edited
  useEffect(() => {
    if (!isSlugManual && name) {
      const generated = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9\s-]/g, '') // remove special characters
        .trim()
        .replace(/\s+/g, '-'); // replace spaces with hyphens
      setSlug(generated);
    }
  }, [name, isSlugManual]);

  // Adjust defaults based on visibility rules
  useEffect(() => {
    if (visibility === 'public') {
      // Public groups can be open or approval-based, but invite-only makes less sense as default
      if (membershipMode === 'invite_only') {
        setMembershipMode('open');
      }
    } else {
      // Private groups default to approval
      if (membershipMode === 'open') {
        setMembershipMode('approval');
      }
    }
  }, [visibility, membershipMode]);

  const createMutation = useMutation({
    mutationFn: () =>
      createGroup({
        name,
        slug,
        description,
        short_description: shortDescription,
        visibility,
        membership_mode: membershipMode,
        posting_mode: postingMode,
        category_id: categoryId,
      }),
    onSuccess: (newGroup) => {
      toast({
        title: 'Comunidade criada!',
        description: 'Sua nova comunidade foi criada com sucesso.',
      });
      router.push(`/groups/${newGroup.slug}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar comunidade',
        description: error.message || 'Verifique as informações e tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 'identity') {
      if (!name.trim()) return toast({ title: 'Nome obrigatório', variant: 'destructive' });
      if (!slug.trim()) return toast({ title: 'Slug obrigatório', variant: 'destructive' });
      setCurrentStep('settings');
    } else if (currentStep === 'settings') {
      setCurrentStep('review');
    }
  };

  const handleBackStep = () => {
    if (currentStep === 'settings') {
      setCurrentStep('identity');
    } else if (currentStep === 'review') {
      setCurrentStep('settings');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 pt-8">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        
        {/* Back Link */}
        <Link href="/groups" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar para Comunidades
        </Link>

        {/* Wizard Card Container */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
          
          {/* Header & Step Indicator */}
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Criar Nova Comunidade</h1>
              <p className="text-xs text-slate-500 font-semibold mt-1">Compartilhe conhecimento e conecte-se com instaladores e integradores.</p>
            </div>

            {/* Stepper bubbles */}
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border transition-all ${
                currentStep === 'identity' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                1. Identidade
              </span>
              <div className="h-px bg-slate-200 flex-1 max-w-[24px]" />
              <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border transition-all ${
                currentStep === 'settings' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                2. Configurações
              </span>
              <div className="h-px bg-slate-200 flex-1 max-w-[24px]" />
              <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border transition-all ${
                currentStep === 'review' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                3. Revisão
              </span>
            </div>
          </div>

          <form onSubmit={handleNextStep} className="space-y-6">
            
            {/* STEP 1: IDENTITY */}
            {currentStep === 'identity' && (
              <div className="space-y-4">
                
                {/* Name */}
                <div className="space-y-1.5">
                  <label htmlFor="group-name" className="text-xs font-bold text-slate-800">Nome da Comunidade</label>
                  <input
                    id="group-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Integradores de Energia Solar Nordeste"
                    className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:border-slate-300 focus:outline-none"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <label htmlFor="group-slug" className="text-xs font-bold text-slate-800">Endereço da Comunidade (Slug)</label>
                  <div className="flex items-center border border-slate-200 rounded-xl focus-within:border-slate-300 overflow-hidden bg-slate-50/50">
                    <span className="text-xs text-slate-400 font-semibold pl-3 select-none">avaliasolar.com.br/groups/</span>
                    <input
                      id="group-slug"
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => {
                        setIsSlugManual(true);
                        setSlug(e.target.value.replace(/\s+/g, '-').toLowerCase());
                      }}
                      placeholder="minha-comunidade"
                      className="flex-1 text-sm bg-transparent border-0 px-1 py-2.5 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Category dropdown */}
                <div className="space-y-1.5">
                  <label htmlFor="group-category" className="text-xs font-bold text-slate-800">Categoria Principal</label>
                  <select
                    id="group-category"
                    value={categoryId || ''}
                    onChange={(e) => setCategoryId(Number(e.target.value) || null)}
                    className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:border-slate-300 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="">Nenhuma (Comunidade Geral)</option>
                    {categories?.map((cat: { id: number; name: string }) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Short Description */}
                <div className="space-y-1.5">
                  <label htmlFor="group-short-desc" className="text-xs font-bold text-slate-800">Descrição Curta (Resumo)</label>
                  <input
                    id="group-short-desc"
                    type="text"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Resumo em uma frase curta (exibida nos cards de descoberta)"
                    className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:border-slate-300 focus:outline-none"
                  />
                </div>

                {/* Detailed Description */}
                <div className="space-y-1.5">
                  <label htmlFor="group-desc" className="text-xs font-bold text-slate-800">Descrição Detalhada / Regras Iniciais</label>
                  <textarea
                    id="group-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Escreva sobre o propósito da comunidade, tópicos discutidos e regras de convivência..."
                    rows={4}
                    className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:border-slate-300 focus:outline-none resize-none"
                  />
                </div>

              </div>
            )}

            {/* STEP 2: PRIVACY & MODERATION SETTINGS */}
            {currentStep === 'settings' && (
              <div className="space-y-6">
                
                {/* Visibility Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-800">Visibilidade da Comunidade</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    <button
                      type="button"
                      onClick={() => setVisibility('public')}
                      className={`flex items-start text-left gap-3 p-4 border rounded-2xl transition-all ${
                        visibility === 'public' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <Globe className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Pública</p>
                        <p className="text-[10px] text-slate-500 leading-normal mt-0.5">Qualquer pessoa pode descobrir, ver publicações e membros.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVisibility('private_visible')}
                      className={`flex items-start text-left gap-3 p-4 border rounded-2xl transition-all ${
                        visibility === 'private_visible' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <Eye className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Privada (Visível)</p>
                        <p className="text-[10px] text-slate-500 leading-normal mt-0.5">Visível na busca, mas apenas membros aprovados vêem o conteúdo.</p>
                      </div>
                    </button>

                  </div>
                </div>

                {/* Membership Mode Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-800">Modo de Adesão (Como membros entram)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    <button
                      type="button"
                      disabled={visibility !== 'public'}
                      onClick={() => setMembershipMode('open')}
                      className={`flex flex-col gap-1.5 p-3 border rounded-xl text-left transition-all ${
                        membershipMode === 'open' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300 bg-white disabled:opacity-50'
                      }`}
                    >
                      <Users className="h-4 w-4 text-slate-600" />
                      <p className="text-xs font-bold text-slate-900">Livre</p>
                      <p className="text-[9px] text-slate-500 leading-normal">Entra imediatamente ao clicar.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMembershipMode('approval')}
                      className={`flex flex-col gap-1.5 p-3 border rounded-xl text-left transition-all ${
                        membershipMode === 'approval' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <Shield className="h-4 w-4 text-slate-600" />
                      <p className="text-xs font-bold text-slate-900">Aprovação</p>
                      <p className="text-[9px] text-slate-500 leading-normal">Solicita entrada e aguarda moderação.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMembershipMode('invite_only')}
                      className={`flex flex-col gap-1.5 p-3 border rounded-xl text-left transition-all ${
                        membershipMode === 'invite_only' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <Lock className="h-4 w-4 text-slate-600" />
                      <p className="text-xs font-bold text-slate-900">Apenas Convite</p>
                      <p className="text-[9px] text-slate-500 leading-normal">Entrada apenas por convite dos admins.</p>
                    </button>

                  </div>
                </div>

                {/* Posting Mode Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-800">Modo de Postagem (Quem publica)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    <button
                      type="button"
                      onClick={() => setPostingMode('anyone')}
                      className={`flex items-start text-left gap-3 p-4 border rounded-2xl transition-all ${
                        postingMode === 'anyone' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <PenTool className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Qualquer Membro</p>
                        <p className="text-[10px] text-slate-500 leading-normal mt-0.5">Todos os membros ativos podem criar novas discussões.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPostingMode('admins_only')}
                      className={`flex items-start text-left gap-3 p-4 border rounded-2xl transition-all ${
                        postingMode === 'admins_only' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <Lock className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Apenas Moderadores</p>
                        <p className="text-[10px] text-slate-500 leading-normal mt-0.5">Apenas donos e moderadores criam discussões (estilo canal).</p>
                      </div>
                    </button>

                  </div>
                </div>

              </div>
            )}

            {/* STEP 3: REVIEW & CREATE */}
            {currentStep === 'review' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Revisar Informações</h2>
                  <p className="text-xs text-slate-500">Confirme se tudo está correto antes de publicar sua comunidade.</p>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-3xl p-5 bg-slate-50 space-y-4">
                  <div className="pt-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Nome da Comunidade</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">avaliasolar.com.br/groups/{slug}</p>
                  </div>

                  <div className="pt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Descrição Curta</p>
                    <p className="text-xs text-slate-700 leading-relaxed mt-0.5">{shortDescription || 'Nenhum resumo informado.'}</p>
                  </div>

                  <div className="pt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Privacidade & Acesso</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Visibilidade: {visibility === 'public' ? 'Pública' : 'Privada'}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        Adesão: {membershipMode === 'open' ? 'Livre' : membershipMode === 'approval' ? 'Aprovação' : 'Convite'}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        Postagem: {postingMode === 'anyone' ? 'Livre' : 'Restrita a Moderadores'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-500 p-2 text-[10px] font-semibold leading-normal">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Ao criar a comunidade, você concorda com os termos de convivência do Avalia Solar.</span>
                </div>
              </div>
            )}

            {/* Form footer buttons */}
            <footer className="flex items-center justify-between border-t border-slate-100 pt-6 mt-8">
              {currentStep !== 'identity' ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackStep}
                  className="text-xs font-bold border-slate-200 text-slate-600 rounded-xl"
                >
                  Voltar
                </Button>
              ) : (
                <div />
              )}

              {currentStep !== 'review' ? (
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-5"
                >
                  Avançar
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-5"
                >
                  {createMutation.isPending ? 'Criando...' : 'Criar Comunidade'}
                </Button>
              )}
            </footer>

          </form>

        </div>
      </div>
    </div>
  );
}
