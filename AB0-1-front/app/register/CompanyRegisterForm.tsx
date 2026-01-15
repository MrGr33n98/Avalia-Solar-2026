'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { fetchApi } from '@/lib/api';
import { formatCNPJ, formatPhone, isValidCNPJ, isValidPhone } from '@/app/dashboard/utils';

// Lista de estados brasileiros (UFs)
const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

interface FormData {
  name: string;
  description: string;
  emailPublic: string;
  phone: string;
  address: string;
  state: string;
  city: string;
  cnpj: string;
  termsAccepted: boolean;
  newsletter: boolean;
}

interface CompanyRegisterFormProps {
  onSuccess: () => void;
}

export default function CompanyRegisterForm({ onSuccess }: CompanyRegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      termsAccepted: false,
      newsletter: false
    }
  });

  const description = watch('description', '');

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setSubmitError(null);

    // Validações manuais extras (embora useForm já faça o básico, podemos refinar aqui se não usarmos Zod/Yup)
    if (!isValidCNPJ(data.cnpj)) {
      setSubmitError('CNPJ inválido');
      setIsLoading(false);
      return;
    }

    try {
      await fetchApi('/companies', {
        method: 'POST',
        body: JSON.stringify({
          company: {
            name: data.name,
            description: data.description,
            email_public: data.emailPublic,
            phone: data.phone,
            address: data.address,
            state: data.state,
            city: data.city,
            cnpj: data.cnpj.replace(/\D/g, ''), // Enviar apenas números
            status: 'pending',
            // Campos extras se necessário
            terms_accepted: data.termsAccepted,
            newsletter_opt_in: data.newsletter
          }
        })
      });
      onSuccess();
    } catch (err: any) {
      console.error('Registration error:', err);
      // Tentar extrair mensagem de erro amigável
      const message = err?.message || 'Ocorreu um erro ao processar o cadastro. Tente novamente.';
      setSubmitError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Máscaras em tempo real
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('phone', formatted);
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setValue('cnpj', formatted);
  };

  return (
    <div className="h-full flex flex-col justify-center p-8 lg:p-12 overflow-y-auto custom-scrollbar">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Cadastro de Empresa</h2>
        <p className="text-slate-600">Preencha os dados abaixo para cadastrar sua empresa.</p>
      </div>

      <AnimatePresence>
        {submitError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Empresa <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            placeholder="Ex: Solar Tech Soluções"
            className={`border-slate-200 focus:ring-emerald-500/20 ${errors.name ? 'border-red-500' : ''}`}
            {...register('name', { required: 'Nome é obrigatório', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })}
          />
          {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição <span className="text-red-500">*</span></Label>
          <Textarea
            id="description"
            placeholder="Descreva brevemente sua empresa e serviços..."
            className={`border-slate-200 focus:ring-emerald-500/20 resize-none h-24 ${errors.description ? 'border-red-500' : ''}`}
            maxLength={160}
            {...register('description', { required: 'Descrição é obrigatória', minLength: { value: 10, message: 'Mínimo 10 caracteres' } })}
          />
          <div className="flex justify-between">
            {errors.description && <span className="text-xs text-red-500">{errors.description.message}</span>}
            <span className="text-xs text-slate-400 ml-auto">{description.length}/160</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="emailPublic">E-mail Público <span className="text-red-500">*</span></Label>
            <Input
              id="emailPublic"
              type="email"
              placeholder="contato@empresa.com"
              className={`border-slate-200 focus:ring-emerald-500/20 ${errors.emailPublic ? 'border-red-500' : ''}`}
              {...register('emailPublic', { 
                required: 'E-mail é obrigatório',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'E-mail inválido'
                }
              })}
            />
            {errors.emailPublic && <span className="text-xs text-red-500">{errors.emailPublic.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone <span className="text-red-500">*</span></Label>
            <Input
              id="phone"
              placeholder="(00) 00000-0000"
              className={`border-slate-200 focus:ring-emerald-500/20 ${errors.phone ? 'border-red-500' : ''}`}
              {...register('phone', { 
                required: 'Telefone é obrigatório',
                validate: (value) => isValidPhone(value) || 'Telefone inválido'
              })}
              onChange={handlePhoneChange}
            />
            {errors.phone && <span className="text-xs text-red-500">{errors.phone.message}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ <span className="text-red-500">*</span></Label>
                <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                className={`border-slate-200 focus:ring-emerald-500/20 ${errors.cnpj ? 'border-red-500' : ''}`}
                {...register('cnpj', { 
                    required: 'CNPJ é obrigatório',
                    validate: (value) => isValidCNPJ(value) || 'CNPJ inválido'
                })}
                onChange={handleCnpjChange}
                />
                {errors.cnpj && <span className="text-xs text-red-500">{errors.cnpj.message}</span>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                    id="address"
                    placeholder="Rua, Número, Bairro"
                    className="border-slate-200 focus:ring-emerald-500/20"
                    {...register('address')}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <Label htmlFor="state">Estado</Label>
            <Select onValueChange={(value) => setValue('state', value)}>
              <SelectTrigger className="border-slate-200 focus:ring-emerald-500/20">
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {UFS.map((uf) => (
                  <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              placeholder="Nome da cidade"
              className="border-slate-200 focus:ring-emerald-500/20"
              {...register('city')}
            />
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-start space-x-2">
            <Checkbox 
                id="terms" 
                className="mt-1"
                onCheckedChange={(checked) => setValue('termsAccepted', checked === true)}
                {...register('termsAccepted', { required: 'Você deve aceitar os termos' })}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Aceito os Termos de Uso e Política de Privacidade <span className="text-red-500">*</span>
              </Label>
              {errors.termsAccepted && <span className="text-xs text-red-500">{errors.termsAccepted.message}</span>}
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
             <Checkbox 
                id="newsletter" 
                className="mt-1"
                onCheckedChange={(checked) => setValue('newsletter', checked === true)}
                {...register('newsletter')}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="newsletter"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Desejo receber novidades e dicas sobre o setor solar
              </Label>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Enviando cadastro...
            </>
          ) : (
            'Cadastrar Empresa'
          )}
        </Button>
      </form>
    </div>
  );
}
