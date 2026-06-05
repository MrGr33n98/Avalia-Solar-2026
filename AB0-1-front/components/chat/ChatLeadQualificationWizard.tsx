'use client';

import { useMemo, useState } from 'react';

export type ChatLeadVertical = 'solar' | 'electric_mobility';

type Option = {
  value: string;
  label: string;
  description?: string;
  intent?: string;
  categorySlug?: string;
  image?: string;
};

type Answers = Record<string, string>;

export interface ChatLeadQualificationSubmission {
  name: string;
  email?: string;
  phone: string;
  city: string;
  state: string;
  vertical: ChatLeadVertical;
  intent: string;
  project_type?: string;
  monthly_bill?: string;
  vehicle_count?: number;
  solution_type?: string;
  budget_range?: string;
  urgency?: string;
  decision_timeline?: string;
  property_type?: string;
  company_size?: string;
  summary?: string;
  wants_reviews?: boolean;
  wants_comparison?: boolean;
  review_interest?: string;
  recommended_next_action: string;
  metadata: {
    qualification_answers: Answers;
    qualification_labels: Answers;
    qualification_source: string;
    qualification_version: string;
    category_seo_url?: string;
  };
  recommendationQuery: string;
}

const REVIEW_INTERESTS: Option[] = [
  { value: 'see_best_rated', label: 'Melhores avaliadas', description: 'Empresas com notas altas' },
  { value: 'high_review_volume', label: 'Mais reviews', description: 'Empresas com mais histórico' },
  { value: 'see_recent_reviews', label: 'Reviews recentes', description: 'Avaliações mais atuais' },
  { value: 'compare_reviews', label: 'Comparar notas por critério', description: 'Prazo, atendimento, etc' },
  { value: 'read_negative_reviews', label: 'Ver pontos negativos', description: 'Entender desafios' },
  { value: 'none', label: 'Ir direto para orçamento', description: 'Pular avaliações' },
];

interface ChatLeadQualificationWizardProps {
  vertical: ChatLeadVertical;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (submission: ChatLeadQualificationSubmission) => Promise<void>;
}

type ChoiceStep = {
  id: string;
  title: string;
  subtitle: string;
  options: Option[];
  layout?: 'list' | 'visual_grid';
};

const SOLAR_NEEDS: Option[] = [
  { value: 'new_installation', label: 'Instalar energia solar', description: 'Quero um projeto novo', intent: 'solar_quote', categorySlug: 'instaladores-energia-solar' },
  { value: 'compare_proposal', label: 'Comparar uma proposta', description: 'Já recebi um orçamento', intent: 'compare_companies', categorySlug: 'instaladores-energia-solar' },
  { value: 'financing', label: 'Buscar financiamento', description: 'Quero avaliar parcelas', intent: 'solar_financing', categorySlug: 'financiamento-energia-solar' },
  { value: 'maintenance', label: 'Manutenção ou suporte', description: 'Já tenho um sistema solar', intent: 'solar_maintenance', categorySlug: 'instaladores-energia-solar' },
  { value: 'other', label: 'Outro objetivo', description: 'Prefiro explicar brevemente', intent: 'general_question', categorySlug: 'energia-solar' },
];

const MOBILITY_NEEDS: Option[] = [
  { value: 'home_wallbox', label: 'Carregador residencial', description: 'Wallbox para casa', intent: 'ev_charger_installation', categorySlug: 'carregadores-residenciais' },
  { value: 'condominium', label: 'Condomínio', description: 'Recarga compartilhada ou por vaga', intent: 'condominium_charging', categorySlug: 'carregadores-comerciais' },
  { value: 'fleet', label: 'Empresa ou frota', description: 'Eletrificação de veículos', intent: 'fleet_electrification', categorySlug: 'carregadores-comerciais' },
  { value: 'charging_station', label: 'Eletroposto', description: 'Estação pública ou comercial', intent: 'charging_station', categorySlug: 'estacoes-publicas' },
  { value: 'solar_integration', label: 'Solar + recarga elétrica', description: 'Quero integrar as soluções', intent: 'ev_charger_installation', categorySlug: 'integracao-solar-ev' },
  { value: 'other', label: 'Outro objetivo', description: 'Prefiro explicar brevemente', intent: 'general_question', categorySlug: 'mobilidade-eletrica' },
];

const SOLAR_PROFILES: Option[] = [
  { value: 'residential', label: 'Residencial', categorySlug: 'energia-solar-residencial' },
  { value: 'commercial', label: 'Comercial ou industrial', categorySlug: 'energia-solar-comercial-industrial' },
  { value: 'rural', label: 'Rural ou agronegócio', categorySlug: 'energia-solar-rural' },
  { value: 'condominium', label: 'Condomínio', categorySlug: 'instaladores-energia-solar' },
];

const MOBILITY_PROFILES: Option[] = [
  { value: 'residence', label: 'Casa ou residência' },
  { value: 'condominium', label: 'Condomínio ou prédio' },
  { value: 'company', label: 'Empresa ou estacionamento' },
  { value: 'public_site', label: 'Ponto aberto ao público' },
];

const MONTHLY_BILLS: Option[] = [
  { value: '300', label: 'Até R$ 300' },
  { value: '600', label: 'R$ 301 a R$ 600' },
  { value: '1200', label: 'R$ 601 a R$ 1.200' },
  { value: '3000', label: 'R$ 1.201 a R$ 3.000' },
  { value: '5000', label: 'Acima de R$ 3.000' },
  { value: '', label: 'Não sei informar' },
];

const VEHICLE_COUNTS: Option[] = [
  { value: '1', label: '1 veículo' },
  { value: '3', label: '2 a 3 veículos' },
  { value: '10', label: '4 a 10 veículos' },
  { value: '20', label: 'Mais de 10 veículos' },
  { value: '', label: 'Ainda estou avaliando' },
];

const TIMELINES: Option[] = [
  { value: 'immediate', label: 'O quanto antes' },
  { value: '30_days', label: 'Nos próximos 30 dias' },
  { value: '1_3_months', label: 'Em 1 a 3 meses' },
  { value: 'researching', label: 'Só estou pesquisando' },
];

const SOLAR_TIMELINES: Option[] = [
  { value: 'this_week', label: 'Essa semana' },
  { value: 'this_month', label: 'Esse mês' },
  { value: 'this_year', label: 'Esse ano' },
  { value: 'future', label: 'No futuro' },
];

const ROOF_TYPES: Option[] = [
  { value: 'ceramico', label: 'Cerâmico', image: '/images/ceramico.PNG' },
  { value: 'metalico', label: 'Metálico', image: '/images/metalico.PNG' },
  { value: 'fibrocimento', label: 'Fibrocimento', image: '/images/fibrocimento.PNG' },
  { value: 'laje', label: 'Laje', image: '/images/late.PNG' },
  { value: 'solo', label: 'Solo', image: '/images/solo.PNG' },
];

const getOption = (options: Option[], value?: string) => options.find((option) => option.value === value);

const optionLabel = (options: Option[], value?: string) => getOption(options, value)?.label || value || '';

export default function ChatLeadQualificationWizard({
  vertical,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: ChatLeadQualificationWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [contact, setContact] = useState({ name: '', email: '', phone: '', cep: '', city: '', state: '', summary: '', consent_given: false });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const needOptions = vertical === 'solar' ? SOLAR_NEEDS : MOBILITY_NEEDS;
  const profileOptions = vertical === 'solar' ? SOLAR_PROFILES : MOBILITY_PROFILES;

  const choiceSteps = useMemo<ChoiceStep[]>(() => {
    const specificStep = vertical === 'solar'
      ? { id: 'monthly_bill', title: 'Qual é sua conta de luz mensal?', subtitle: 'Uma faixa aproximada já ajuda a recomendar o perfil ideal.', options: MONTHLY_BILLS }
      : { id: 'vehicle_count', title: 'Quantos veículos precisam de recarga?', subtitle: 'Pode ser uma estimativa inicial.', options: VEHICLE_COUNTS };

    const baseSteps: ChoiceStep[] = [
      {
        id: 'need',
        title: vertical === 'solar' ? 'O que você busca em energia solar?' : 'Qual solução de mobilidade elétrica você busca?',
        subtitle: 'Escolha a opção mais próxima. Você poderá complementar no final.',
        options: needOptions,
      },
      {
        id: 'profile',
        title: vertical === 'solar' ? 'Qual é o perfil do imóvel?' : 'Onde a solução será utilizada?',
        subtitle: 'Isso ajuda a encontrar empresas com experiência no seu cenário.',
        options: profileOptions,
      },
    ];

    if (vertical === 'solar') {
      baseSteps.push({
        id: 'roof_type',
        title: 'Tipo de telhado:',
        subtitle: 'Selecione o tipo de superfície para instalação',
        options: ROOF_TYPES,
        layout: 'visual_grid',
      });
    }

    baseSteps.push(specificStep);

    baseSteps.push({
      id: 'timeline',
      title: vertical === 'solar' ? 'Em quanto tempo pretende começar a zerar a sua conta de luz?' : 'Quando você pretende avançar?',
      subtitle: 'Vamos ajustar a recomendação ao seu momento de compra.',
      options: vertical === 'solar' ? SOLAR_TIMELINES : TIMELINES,
    });

    baseSteps.push({
      id: 'review_interest',
      title: 'Que tipo de avaliação você quer ver?',
      subtitle: 'Isso ajuda a filtrar as empresas antes do orçamento.',
      options: REVIEW_INTERESTS,
    });

    return baseSteps;
  }, [needOptions, profileOptions, vertical]);

  const totalSteps = choiceSteps.length + 2;
  const isLocationStep = stepIndex === choiceSteps.length;
  const isContactStep = stepIndex === choiceSteps.length + 1;
  const activeChoiceStep = choiceSteps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / totalSteps) * 100);

  const selectOption = (step: ChoiceStep, option: Option) => {
    setAnswers((current) => ({ ...current, [step.id]: option.value }));
    setStepIndex((current) => Math.min(current + 1, totalSteps - 1));
  };

  const goBack = () => setStepIndex((current) => Math.max(0, current - 1));

  const updateContact = (field: keyof typeof contact, value: string | boolean) => {
    setContact((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    if (!contact.consent_given) {
      setErrorMsg('Você precisa aceitar os termos da LGPD para continuar.');
      return;
    }
    if (!contact.name.trim() || !contact.email.trim() || !contact.phone.trim()) {
      setErrorMsg('Por favor, preencha nome, e-mail e WhatsApp.');
      return;
    }
    if (!contact.city.trim() || contact.state.trim().length !== 2) {
      setErrorMsg('Por favor, volte e informe um CEP válido com Cidade/UF.');
      return;
    }
    if (answers.need === 'other' && !contact.summary.trim()) {
      setErrorMsg('Por favor, conte brevemente o que você procura no campo de texto.');
      return;
    }

    const need = getOption(needOptions, answers.need);
    const profile = getOption(profileOptions, answers.profile);
    const timeline = getOption(TIMELINES, answers.timeline);
    
    const labels: Answers = {
      need: optionLabel(needOptions, answers.need),
      profile: optionLabel(profileOptions, answers.profile),
      timeline: optionLabel(TIMELINES, answers.timeline),
      review_interest: optionLabel(REVIEW_INTERESTS, answers.review_interest),
      [vertical === 'solar' ? 'monthly_bill' : 'vehicle_count']:
        vertical === 'solar'
          ? optionLabel(MONTHLY_BILLS, answers.monthly_bill)
          : optionLabel(VEHICLE_COUNTS, answers.vehicle_count),
    };
    const categorySlug = profile?.categorySlug || need?.categorySlug;
    const needLabel = labels.need;
    const profileLabel = labels.profile;
    const verticalLabel = vertical === 'solar' ? 'energia solar' : 'mobilidade elétrica';
    const recommendationQuery = [
      `Quero recomendações de empresas para ${verticalLabel}`,
      needLabel ? `para ${needLabel}` : '',
      profileLabel ? `com perfil ${profileLabel}` : '',
      `em ${contact.city.trim()} ${contact.state.trim().toUpperCase()}.`,
      answers.review_interest && answers.review_interest !== 'none' ? `Tenho interesse em ver: ${labels.review_interest}.` : '',
      'Mostre empresas cadastradas e seus reviews.',
    ].filter(Boolean).join(' ');

    await onSubmit({
      name: contact.name.trim(),
      email: contact.email.trim(),
      phone: contact.phone.trim(),
      city: contact.city.trim(),
      state: contact.state.trim().toUpperCase(),
      vertical,
      intent: need?.intent || 'company_recommendation',
      project_type: answers.need,
      monthly_bill: vertical === 'solar' ? answers.monthly_bill || undefined : undefined,
      vehicle_count: vertical === 'electric_mobility' && answers.vehicle_count ? Number(answers.vehicle_count) : undefined,
      solution_type: vertical === 'electric_mobility' ? answers.need : undefined,
      budget_range: vertical === 'solar' ? labels.monthly_bill : undefined,
      urgency: answers.timeline === 'immediate' ? 'imediata' : undefined,
      decision_timeline: timeline?.value,
      property_type: answers.profile,
      company_size: vertical === 'electric_mobility' ? answers.profile : undefined,
      summary: contact.summary.trim() || undefined,
      wants_reviews: answers.review_interest !== 'none',
      wants_comparison: answers.review_interest === 'compare_reviews' || answers.need === 'compare_proposal',
      review_interest: answers.review_interest !== 'none' ? answers.review_interest : undefined,
      recommended_next_action: 'Mostrar empresas cadastradas na região e orientar leitura dos reviews.',
      metadata: {
        qualification_answers: { ...answers, summary: contact.summary.trim() },
        qualification_labels: labels,
        qualification_source: 'guided_chat_wizard',
        qualification_version: 'v2',
        category_seo_url: categorySlug,
      },
      recommendationQuery,
    });
  };

  return (
    <div className="bg-brand-blue/5 dark:bg-[#0F172A] border border-brand-blue/20 dark:border-zinc-700 rounded-2xl p-4 shadow-md space-y-4 animate-in fade-in zoom-in-95">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-brand-blue">
          <span>{vertical === 'solar' ? 'Consultoria Solar' : 'Consultoria de Mobilidade Elétrica'}</span>
          <span>{stepIndex + 1}/{totalSteps}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white dark:bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-cyan transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {activeChoiceStep && (
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">{activeChoiceStep.title}</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{activeChoiceStep.subtitle}</p>
          </div>
          <div className={activeChoiceStep.layout === 'visual_grid' ? "grid grid-cols-3 gap-2" : "grid grid-cols-1 gap-2"}>
            {activeChoiceStep.options.map((option) => (
              <button
                key={`${activeChoiceStep.id}-${option.value || 'unknown'}`}
                type="button"
                onClick={() => selectOption(activeChoiceStep, option)}
                className={`rounded-xl border transition-all hover:border-brand-blue hover:bg-white dark:hover:bg-zinc-900 ${activeChoiceStep.layout === 'visual_grid' ? 'p-2 flex flex-col items-center justify-start space-y-2' : 'px-3 py-2.5 text-left'} ${
                  answers[activeChoiceStep.id] === option.value
                    ? 'border-brand-blue bg-white dark:bg-zinc-900 ring-1 ring-brand-blue/30'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50'
                }`}
              >
                {activeChoiceStep.layout === 'visual_grid' && option.image && (
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm flex-shrink-0 bg-white flex items-center justify-center">
                    <img src={option.image} alt={option.label} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={activeChoiceStep.layout === 'visual_grid' ? 'text-center w-full' : ''}>
                  <span className={`block text-xs font-bold text-zinc-800 dark:text-zinc-100 leading-tight`}>{option.label}</span>
                  {option.description && <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{option.description}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isLocationStep && (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (contact.cep.trim().length === 9 || (contact.city.trim() && contact.state.trim().length === 2)) setStepIndex((current) => current + 1);
          }}
        >
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">Onde você precisa da solução?</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Insira o CEP para encontrarmos empresas na sua região.</p>
          </div>
          <div>
            <input 
              required 
              value={contact.cep} 
              onChange={(event) => {
                let value = event.target.value.replace(/\D/g, '');
                if (value.length > 5) value = value.replace(/^(\d{5})(\d)/, '$1-$2');
                value = value.substring(0, 9);
                updateContact('cep', value);
                
                if (value.length === 9) {
                  fetch(`https://viacep.com.br/ws/${value.replace('-', '')}/json/`)
                    .then(res => res.json())
                    .then(data => {
                      if (!data.erro) {
                        updateContact('city', data.localidade);
                        updateContact('state', data.uf);
                      }
                    }).catch(() => {});
                }
              }} 
              placeholder="00000-000" 
              className="w-full text-xs text-center px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue" 
            />
          </div>
          {contact.cep.length === 9 && (
            <div className="grid grid-cols-3 gap-2">
              <input required value={contact.city} onChange={(event) => updateContact('city', event.target.value)} placeholder="Cidade" className="col-span-2 w-full text-xs px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              <input required maxLength={2} value={contact.state} onChange={(event) => updateContact('state', event.target.value.toUpperCase())} placeholder="UF" className="w-full text-xs text-center px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
          )}
          <button type="submit" disabled={contact.cep.length < 9} className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2.5 rounded-lg text-xs transition-colors disabled:opacity-50">Continuar</button>
        </form>
      )}

      {isContactStep && (
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">Quase pronto. Como podemos falar com você?</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Usaremos seus dados para conectar você às opções mais aderentes.</p>
          </div>
          <input required value={contact.name} onChange={(event) => updateContact('name', event.target.value)} placeholder="Nome completo" className="w-full text-xs px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          <input required type="email" value={contact.email} onChange={(event) => updateContact('email', event.target.value)} placeholder="E-mail" className="w-full text-xs px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          <input required type="tel" value={contact.phone} onChange={(event) => updateContact('phone', event.target.value)} placeholder="WhatsApp com DDD" className="w-full text-xs px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          <textarea required={answers.need === 'other'} value={contact.summary} onChange={(event) => updateContact('summary', event.target.value)} placeholder={answers.need === 'other' ? 'Conte brevemente o que você procura.' : 'Quer complementar? Escreva brevemente o que procura.'} rows={3} className="w-full resize-none text-xs px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          <label className="flex items-start space-x-2 cursor-pointer">
            <input type="checkbox" required checked={contact.consent_given} onChange={(event) => updateContact('consent_given', event.target.checked)} className="mt-0.5 rounded text-brand-blue focus:ring-brand-blue border-zinc-300 dark:border-zinc-700" />
            <span className="text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">Aceito compartilhar meus dados para receber contato e recomendações de empresas parceiras, conforme a LGPD.</span>
          </label>
          {errorMsg && (
            <div className="text-red-500 dark:text-red-400 text-[10px] font-semibold bg-red-500/10 border border-red-500/20 rounded-lg p-2 leading-tight">
              {errorMsg}
            </div>
          )}
          <button disabled={isSubmitting} type="submit" className="w-full bg-gradient-to-r from-brand-yellow to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-60 text-zinc-900 font-bold py-2.5 rounded-lg text-xs shadow-md transition-colors">
            {isSubmitting ? 'Enviando...' : 'Encontrar empresas e reviews'}
          </button>
        </form>
      )}

      <div className="flex items-center justify-between pt-1">
        <button type="button" onClick={stepIndex === 0 ? onCancel : goBack} className="text-[11px] font-medium text-zinc-500 hover:text-brand-blue transition-colors">
          {stepIndex === 0 ? 'Continuar pelo chat' : 'Voltar'}
        </button>
        {!isContactStep && <span className="text-[10px] text-zinc-400">Respostas rápidas, menos de 1 minuto</span>}
      </div>
    </div>
  );
}
