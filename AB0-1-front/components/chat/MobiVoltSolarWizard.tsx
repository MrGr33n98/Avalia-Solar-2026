'use client';

import { useState, useCallback } from 'react';
import { track } from '@/lib/analytics/lazy';

export type SolarSolutionType =
  | 'residential_installation'
  | 'commercial_installation'
  | 'rural_farm'
  | 'condominium'
  | 'battery_storage'
  | 'carport'
  | 'financing'
  | 'not_sure';

export interface SolarWizardStep {
  id: string;
  title: string;
  subtitle: string;
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
}

const SOLAR_WIZARD_STEPS: SolarWizardStep[] = [
  {
    id: 'solution_type',
    title: 'Qual tipo de solução solar você procura?',
    subtitle: 'Escolha a opção que melhor descreve seu projeto',
    options: [
      { value: 'residential_installation', label: 'Instalação residencial', description: 'Para minha casa' },
      { value: 'commercial_installation', label: 'Instalação comercial', description: 'Para empresa ou indústria' },
      { value: 'rural_farm', label: 'Fazenda/rural', description: 'Propriedade rural ou agronegócio' },
      { value: 'condominium', label: 'Condomínio', description: 'Área comum ou por vaga' },
      { value: 'battery_storage', label: 'Baterias/armazenamento', description: 'Sistema de backup' },
      { value: 'carport', label: 'Carport/cobertura solar', description: 'Estrutura com painéis' },
      { value: 'financing', label: 'Financiamento solar', description: 'Quero parcelar o projeto' },
      { value: 'not_sure', label: 'Ainda não sei', description: 'Preciso de orientação' }
    ]
  },
  {
    id: 'location',
    title: 'Em qual cidade e estado você precisa do serviço?',
    subtitle: 'Vamos buscar empresas que atendem sua região',
    options: [
      { value: 'use_my_location', label: 'Usar minha localização', description: 'Detectar automaticamente' },
      { value: 'enter_city', label: 'Digitar cidade', description: 'Informar manualmente' },
      { value: 'compare_regions', label: 'Comparar regiões', description: 'Ver opções em várias cidades' }
    ]
  },
  {
    id: 'timeline',
    title: 'Quando você pretende contratar?',
    subtitle: 'Isso ajuda a priorizar as melhores opções para seu momento',
    options: [
      { value: 'now', label: 'Quero agora', description: 'O quanto antes' },
      { value: '30_days', label: 'Nos próximos 30 dias', description: 'Planejando a curto prazo' },
      { value: 'researching', label: 'Estou pesquisando', description: 'Avaliando opções' },
      { value: 'compare', label: 'Quero comparar opções', description: 'Ver diferentes propostas' }
    ]
  },
  {
    id: 'electric_bill',
    title: 'Qual é aproximadamente sua conta de luz?',
    subtitle: 'Uma faixa aproximada já nos ajuda a dimensionar',
    options: [
      { value: 'up_to_300', label: 'Até R$ 300', description: 'Consumo baixo' },
      { value: '300_to_700', label: 'R$ 300 a R$ 700', description: 'Consumo médio' },
      { value: '700_to_1500', label: 'R$ 700 a R$ 1.500', description: 'Consumo alto' },
      { value: 'above_1500', label: 'Acima de R$ 1.500', description: 'Consumo muito alto' },
      { value: 'not_sure', label: 'Não sei informar', description: 'Preciso verificar' }
    ]
  },
  {
    id: 'goal',
    title: 'O que você mais quer alcançar agora?',
    subtitle: 'Seu objetivo principal nos ajuda a direcionar melhor',
    options: [
      { value: 'reduce_bill', label: 'Reduzir conta de luz', description: 'Economia na fatura' },
      { value: 'get_quote', label: 'Pedir orçamento', description: 'Receber proposta' },
      { value: 'compare_companies', label: 'Comparar empresas', description: 'Ver diferenças' },
      { value: 'see_reviews', label: 'Ver avaliações', description: 'Conferir reputação' },
      { value: 'understand_financing', label: 'Entender financiamento', description: 'Opções de pagamento' },
      { value: 'see_projects', label: 'Ver projetos/perfis', description: 'Conhecer trabalhos' }
    ]
  }
];

interface MobiVoltSolarWizardProps {
  onComplete: (answers: Record<string, string>) => void;
  onBack?: () => void;
}

export default function MobiVoltSolarWizard({
  onComplete,
  onBack
}: MobiVoltSolarWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [locationInput, setLocationInput] = useState({ city: '', state: '' });

  const currentStep = SOLAR_WIZARD_STEPS[currentStepIndex];
  const totalSteps = SOLAR_WIZARD_STEPS.length;
  const progress = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  const handleOptionSelect = useCallback((optionValue: string) => {
    const newAnswers = { ...answers, [currentStep.id]: optionValue };
    setAnswers(newAnswers);

    track('mobivolt_wizard_step_completed', {
      vertical: 'solar',
      step_id: currentStep.id,
      step_index: currentStepIndex,
      selected_value: optionValue
    });

    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Último passo - completar wizard
      track('mobivolt_wizard_completed', {
        vertical: 'solar',
        total_steps: totalSteps,
        answers_count: Object.keys(newAnswers).length
      });
      onComplete(newAnswers);
    }
  }, [answers, currentStep, currentStepIndex, totalSteps, onComplete]);

  const handleLocationSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput.city.trim() || !locationInput.state.trim()) return;

    const newAnswers = {
      ...answers,
      [currentStep.id]: `entered:${locationInput.city},${locationInput.state.toUpperCase()}`
    };
    setAnswers(newAnswers);

    track('mobivolt_wizard_step_completed', {
      vertical: 'solar',
      step_id: currentStep.id,
      step_index: currentStepIndex,
      selected_value: 'manual_location',
      city: locationInput.city,
      state: locationInput.state
    });

    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      track('mobivolt_wizard_completed', {
        vertical: 'solar',
        total_steps: totalSteps,
        answers_count: Object.keys(newAnswers).length
      });
      onComplete(newAnswers);
    }
  }, [answers, currentStep, currentStepIndex, totalSteps, locationInput, onComplete]);

  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      track('mobivolt_wizard_step_back', {
        vertical: 'solar',
        step_index: currentStepIndex
      });
    } else if (onBack) {
      onBack();
    }
  }, [currentStepIndex, onBack]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header com Progresso */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-brand-blue">
          <span>Consultoria Solar</span>
          <span>{currentStepIndex + 1}/{totalSteps}</span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-cyan transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Conteúdo do Passo */}
      <div className="space-y-3">
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
            {currentStep.title}
          </h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {currentStep.subtitle}
          </p>
        </div>

        {/* Opções do Passo */}
        {currentStep.id === 'location' ? (
          <form onSubmit={handleLocationSubmit} className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                required
                value={locationInput.city}
                onChange={(e) => setLocationInput(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Cidade"
                className="col-span-2 w-full text-xs px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <input
                type="text"
                required
                maxLength={2}
                value={locationInput.state}
                onChange={(e) => setLocationInput(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                placeholder="UF"
                className="w-full text-xs text-center px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2.5 rounded-lg text-xs transition-colors"
            >
              Continuar
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {currentStep.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOptionSelect(option.value)}
                className="group w-full text-left px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 hover:border-brand-blue/50 transition-all duration-200 active:scale-[0.98]"
              >
                <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-brand-blue transition-colors">
                  {option.label}
                </span>
                {option.description && (
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {option.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Botão Voltar */}
      {currentStepIndex > 0 && currentStep.id !== 'location' && (
        <button
          onClick={handleBack}
          className="w-full text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors py-2"
        >
          ← Voltar para a pergunta anterior
        </button>
      )}
    </div>
  );
}
