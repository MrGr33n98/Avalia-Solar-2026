'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { companiesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Building2,
  User,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ChevronRight,
  Mail,
  FileText,
  Briefcase,
} from 'lucide-react';

// ─── Tipos ─────────────────────────────────────────────────────────────────

interface Step1Data {
  razao_social: string;
  nome_comercial: string;
  cnpj: string;
  website: string;
  email: string;
  state: string;
  city: string;
  category_ids: number[];
}

interface Step2Data {
  nome_completo: string;
  cargo: string;
  email_corporativo: string;
  telefone: string;
  tipo_vinculo: string;
  declaracao_verdadeira: boolean;
}

type WizardStep = 1 | 2 | 3;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trimEnd();
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trimEnd();
}

const TIPO_VINCULO_OPTIONS = [
  { value: 'socio', label: 'Sócio / Proprietário' },
  { value: 'gerente', label: 'Gerente / Diretor' },
  { value: 'colaborador', label: 'Colaborador autorizado' },
  { value: 'representante', label: 'Representante comercial' },
];

// ─── Componente de progresso ─────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: WizardStep; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => i + 1).map((step) => {
        const isActive = step === current;
        const isDone = step < current;
        return (
          <div key={step} className="flex items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${isDone ? 'bg-blue-600 text-white' : isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-100 text-gray-400'}`}
            >
              {isDone ? <CheckCircle className="w-4 h-4" /> : step}
            </div>
            {step < total && (
              <div className={`h-px w-8 mx-1 ${isDone ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
      <span className="ml-2 text-xs text-gray-400 font-medium">
        {current}/{total}
      </span>
    </div>
  );
}

// ─── Etapa 1: Dados da empresa ────────────────────────────────────────────────

function Step1({
  data,
  onChange,
  onNext,
  errors,
}: {
  data: Step1Data;
  onChange: (patch: Partial<Step1Data>) => void;
  onNext: () => void;
  errors: Partial<Record<keyof Step1Data, string>>;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-blue-600" />
          <Label htmlFor="razao_social" className="text-sm font-semibold text-gray-700">
            Razão social <span className="text-red-500">*</span>
          </Label>
        </div>
        <Input
          id="razao_social"
          placeholder="WEG Soluções Industriais Ltda."
          value={data.razao_social}
          onChange={(e) => onChange({ razao_social: e.target.value })}
          className={`h-11 ${errors.razao_social ? 'border-red-400 focus-visible:ring-red-300' : 'focus-visible:ring-blue-200'}`}
        />
        {errors.razao_social && <p className="text-xs text-red-500 mt-1">{errors.razao_social}</p>}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-blue-600" />
          <Label htmlFor="nome_comercial" className="text-sm font-semibold text-gray-700">
            Nome comercial
          </Label>
        </div>
        <Input
          id="nome_comercial"
          placeholder="WEG Soluções"
          value={data.nome_comercial}
          onChange={(e) => onChange({ nome_comercial: e.target.value })}
          className="h-11 focus-visible:ring-blue-200"
        />
        <p className="text-xs text-gray-400 mt-1">
          Nome pelo qual a empresa é conhecida no mercado (opcional)
        </p>
      </div>

      <div>
        <Label htmlFor="cnpj" className="text-sm font-semibold text-gray-700">
          CNPJ <span className="text-red-500">*</span>
        </Label>
        <Input
          id="cnpj"
          placeholder="84.429.695/0001-11"
          value={data.cnpj}
          onChange={(e) => onChange({ cnpj: formatCnpj(e.target.value) })}
          className={`h-11 mt-1 ${errors.cnpj ? 'border-red-400 focus-visible:ring-red-300' : 'focus-visible:ring-blue-200'}`}
        />
        {errors.cnpj && <p className="text-xs text-red-500 mt-1">{errors.cnpj}</p>}
      </div>

      <div>
        <Label htmlFor="website" className="text-sm font-semibold text-gray-700">
          Website (opcional)
        </Label>
        <Input
          id="website"
          type="url"
          placeholder="https://www.suaempresa.com.br"
          value={data.website}
          onChange={(e) => onChange({ website: e.target.value })}
          className="h-11 mt-1 focus-visible:ring-blue-200"
        />
      </div>

      <div>
        <Label htmlFor="company_email">E-mail da empresa *</Label>
        <Input
          id="company_email"
          type="email"
          value={data.email}
          onChange={(e) => onChange({ email: e.target.value })}
          className="h-11 mt-1"
        />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="company_state">Estado *</Label>
          <Input
            id="company_state"
            maxLength={2}
            value={data.state}
            onChange={(e) => onChange({ state: e.target.value.toUpperCase() })}
            className="h-11 mt-1"
          />
          {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
        </div>
        <div>
          <Label htmlFor="company_city">Cidade *</Label>
          <Input
            id="company_city"
            value={data.city}
            onChange={(e) => onChange({ city: e.target.value })}
            className="h-11 mt-1"
          />
          {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="company_categories">Categorias *</Label>
        <Input
          id="company_categories"
          placeholder="IDs separados por vírgula"
          value={data.category_ids.join(',')}
          onChange={(e) =>
            onChange({ category_ids: e.target.value.split(',').map(Number).filter(Boolean) })
          }
          className="h-11 mt-1"
        />
        {errors.category_ids && <p className="text-xs text-red-500 mt-1">{errors.category_ids}</p>}
      </div>

      <Button
        type="submit"
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2"
      >
        Continuar
        <ChevronRight className="w-4 h-4" />
      </Button>
    </form>
  );
}

// ─── Etapa 2: Responsável e contato ──────────────────────────────────────────

function Step2({
  data,
  onChange,
  onNext,
  onBack,
  errors,
  isSubmitting,
}: {
  data: Step2Data;
  onChange: (patch: Partial<Step2Data>) => void;
  onNext: () => void;
  onBack: () => void;
  errors: Partial<Record<keyof Step2Data, string>>;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-blue-600" />
          <Label htmlFor="nome_completo" className="text-sm font-semibold text-gray-700">
            Nome completo <span className="text-red-500">*</span>
          </Label>
        </div>
        <Input
          id="nome_completo"
          placeholder="Felipe Henrique"
          value={data.nome_completo}
          onChange={(e) => onChange({ nome_completo: e.target.value })}
          className={`h-11 ${errors.nome_completo ? 'border-red-400' : 'focus-visible:ring-blue-200'}`}
        />
        {errors.nome_completo && (
          <p className="text-xs text-red-500 mt-1">{errors.nome_completo}</p>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Briefcase className="w-4 h-4 text-blue-600" />
          <Label htmlFor="cargo" className="text-sm font-semibold text-gray-700">
            Cargo / Função <span className="text-red-500">*</span>
          </Label>
        </div>
        <Input
          id="cargo"
          placeholder="Gerente Comercial"
          value={data.cargo}
          onChange={(e) => onChange({ cargo: e.target.value })}
          className={`h-11 ${errors.cargo ? 'border-red-400' : 'focus-visible:ring-blue-200'}`}
        />
        {errors.cargo && <p className="text-xs text-red-500 mt-1">{errors.cargo}</p>}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-blue-600" />
          <Label htmlFor="email_corporativo" className="text-sm font-semibold text-gray-700">
            E-mail corporativo <span className="text-red-500">*</span>
          </Label>
        </div>
        <Input
          id="email_corporativo"
          type="email"
          placeholder="felipe@weg.net"
          value={data.email_corporativo}
          onChange={(e) => onChange({ email_corporativo: e.target.value })}
          className={`h-11 ${errors.email_corporativo ? 'border-red-400' : 'focus-visible:ring-blue-200'}`}
        />
        {errors.email_corporativo && (
          <p className="text-xs text-red-500 mt-1">{errors.email_corporativo}</p>
        )}
      </div>

      <div>
        <Label htmlFor="telefone" className="text-sm font-semibold text-gray-700">
          Telefone / WhatsApp <span className="text-red-500">*</span>
        </Label>
        <Input
          id="telefone"
          placeholder="(85) 99924-3209"
          value={data.telefone}
          onChange={(e) => onChange({ telefone: formatPhone(e.target.value) })}
          className={`h-11 mt-1 ${errors.telefone ? 'border-red-400' : 'focus-visible:ring-blue-200'}`}
        />
        {errors.telefone && <p className="text-xs text-red-500 mt-1">{errors.telefone}</p>}
      </div>

      <div>
        <Label htmlFor="tipo_vinculo" className="text-sm font-semibold text-gray-700">
          Tipo de vínculo <span className="text-red-500">*</span>
        </Label>
        <select
          id="tipo_vinculo"
          value={data.tipo_vinculo}
          onChange={(e) => onChange({ tipo_vinculo: e.target.value })}
          className={`mt-1 h-11 w-full rounded-md border px-3 text-sm bg-white text-gray-900
            ${errors.tipo_vinculo ? 'border-red-400' : 'border-gray-200'}
            focus:outline-none focus:ring-2 focus:ring-blue-200`}
        >
          <option value="">Selecione...</option>
          {TIPO_VINCULO_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.tipo_vinculo && <p className="text-xs text-red-500 mt-1">{errors.tipo_vinculo}</p>}
      </div>

      <div className="flex items-start gap-3 pt-1">
        <Checkbox
          id="declaracao"
          checked={data.declaracao_verdadeira}
          onCheckedChange={(v) => onChange({ declaracao_verdadeira: v === true })}
          className="mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        />
        <Label htmlFor="declaracao" className="text-sm text-gray-600 font-normal cursor-pointer">
          Declaro que as informações fornecidas são verdadeiras
          {errors.declaracao_verdadeira && (
            <span className="block text-xs text-red-500 mt-0.5">
              {errors.declaracao_verdadeira}
            </span>
          )}
        </Label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1 h-11 gap-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button
          type="submit"
          className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar para análise'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}

// ─── Etapa 3: Sucesso ─────────────────────────────────────────────────────────

function Step3({
  companyName,
  onDashboard,
  onHome,
}: {
  companyName: string;
  onDashboard: () => void;
  onHome: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center py-4 gap-6">
      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-blue-600" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Empresa cadastrada com sucesso!</h2>
        <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
          Estamos analisando as informações da{' '}
          <span className="font-semibold text-gray-700">{companyName}</span>. Você receberá um
          e-mail assim que houver novidades.
        </p>
      </div>

      <div className="w-full rounded-xl bg-blue-50 border border-blue-100 p-4 text-left space-y-1">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
          Próximos passos
        </p>
        <ul className="text-sm text-gray-600 space-y-1 mt-2">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            Nossa equipe verificará as informações
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            Enviaremos confirmação por e-mail
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            Acesso ao painel liberado após aprovação
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Button variant="outline" className="flex-1 h-11" onClick={onHome}>
          Voltar para início
        </Button>
        <Button
          className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2"
          onClick={onDashboard}
        >
          Acompanhar solicitação
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Wizard principal ─────────────────────────────────────────────────────────

const STEP_LABELS = ['Dados da empresa', 'Responsável e contato', 'Envio concluído'];

export default function RegisterCompanyPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<WizardStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdCompanyName, setCreatedCompanyName] = useState('');

  const [step1, setStep1] = useState<Step1Data>({
    razao_social: '',
    nome_comercial: '',
    cnpj: '',
    website: '',
    email: '',
    state: '',
    city: '',
    category_ids: [],
  });

  const [step2, setStep2] = useState<Step2Data>({
    nome_completo: user?.name ?? '',
    cargo: '',
    email_corporativo: user?.email ?? '',
    telefone: user?.phone ?? '',
    tipo_vinculo: '',
    declaracao_verdadeira: false,
  });

  const [errors1, setErrors1] = useState<Partial<Record<keyof Step1Data, string>>>({});
  const [errors2, setErrors2] = useState<Partial<Record<keyof Step2Data, string>>>({});

  // Validação etapa 1
  const validateStep1 = (): boolean => {
    const errs: Partial<Record<keyof Step1Data, string>> = {};
    if (!step1.razao_social.trim()) errs.razao_social = 'Razão social é obrigatória';
    const digits = step1.cnpj.replace(/\D/g, '');
    if (digits.length !== 14) errs.cnpj = 'CNPJ deve ter 14 dígitos';
    if (!step1.email.includes('@')) errs.email = 'E-mail inválido';
    if (!step1.state.trim()) errs.state = 'Selecione um estado';
    if (!step1.city.trim()) errs.city = 'Selecione uma cidade';
    if (step1.category_ids.length === 0) errs.category_ids = 'Selecione pelo menos uma categoria';
    setErrors1(errs);
    return Object.keys(errs).length === 0;
  };

  // Validação etapa 2
  const validateStep2 = (): boolean => {
    const errs: Partial<Record<keyof Step2Data, string>> = {};
    if (!step2.nome_completo.trim()) errs.nome_completo = 'Nome completo é obrigatório';
    if (!step2.cargo.trim()) errs.cargo = 'Cargo é obrigatório';
    if (!step2.email_corporativo.includes('@')) errs.email_corporativo = 'E-mail inválido';
    const tel = step2.telefone.replace(/\D/g, '');
    if (tel.length < 10) errs.telefone = 'Telefone inválido';
    if (!step2.tipo_vinculo) errs.tipo_vinculo = 'Selecione o tipo de vínculo';
    if (!step2.declaracao_verdadeira)
      errs.declaracao_verdadeira = 'Você precisa declarar que as informações são verdadeiras';
    setErrors2(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextFromStep1 = () => {
    if (validateStep1()) setStep(2);
  };

  const handleNextFromStep2 = async () => {
    if (!validateStep2()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await (companiesApi.create as unknown as (c: unknown) => Promise<unknown>)({
        name: step1.razao_social.trim(),
        cnpj: step1.cnpj.replace(/\D/g, ''),
        email: step1.email.trim(),
        state: step1.state.trim().toUpperCase(),
        city: step1.city.trim(),
        category_ids: step1.category_ids,
        website: step1.website.trim() || undefined,
        phone: step2.telefone.replace(/\D/g, ''),
        email_public: step2.email_corporativo.trim(),
        description: step1.nome_comercial
          ? `Nome comercial: ${step1.nome_comercial.trim()}`
          : undefined,
      });
      setCreatedCompanyName(step1.razao_social);
      setStep(3);
    } catch (error: unknown) {
      const err = error as { message?: string; context?: { details?: { message?: string } } };
      const message = err?.context?.details?.message || err?.message || '';
      setSubmitError(
        message.replace(/^\[422\]\s*/, '') ||
          'Não foi possível enviar o cadastro. Revise os campos destacados e tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 flex items-start justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.push('/select-company')}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {step === 3 ? 'Cadastro concluído' : 'Cadastrar nova empresa'}
            </h1>
            {step < 3 && <p className="text-sm text-gray-500">{STEP_LABELS[step - 1]}</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {step < 3 && <StepIndicator current={step} total={2} />}

          {submitError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {step === 1 && (
            <Step1
              data={step1}
              onChange={(p) => setStep1((prev) => ({ ...prev, ...p }))}
              onNext={handleNextFromStep1}
              errors={errors1}
            />
          )}

          {step === 2 && (
            <>
              {isSubmitting && (
                <div className="flex items-center gap-2 text-sm text-blue-600 mb-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando para análise...
                </div>
              )}
              <Step2
                data={step2}
                onChange={(p) => setStep2((prev) => ({ ...prev, ...p }))}
                onNext={handleNextFromStep2}
                isSubmitting={isSubmitting}
                onBack={() => setStep(1)}
                errors={errors2}
              />
            </>
          )}

          {step === 3 && (
            <Step3
              companyName={createdCompanyName}
              onDashboard={() => router.push('/select-company')}
              onHome={() => router.push('/')}
            />
          )}
        </div>

        {/* Avalia Solar Pro CTA */}
        {step < 3 && (
          <div className="mt-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-white">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">
              Avalia Solar Pro
            </p>
            <p className="text-sm font-semibold mb-0.5">Mais confiança. Mais inteligência.</p>
            <p className="text-xs text-slate-400">
              Após aprovação, acesse análises, oportunidades e muito mais.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
