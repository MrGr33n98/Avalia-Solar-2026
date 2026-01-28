'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Loader2, AlertCircle, CheckCircle, ArrowRight, RefreshCcw, Building, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
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
import { useRouter } from 'next/navigation';

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

export default function RegisterCompanyTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      termsAccepted: false,
      newsletter: false
    }
  });

  const description = watch('description', '');

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setSubmitError('O logo deve ter no máximo 2MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type)) {
        setSubmitError('Formato inválido. Use JPG, PNG ou SVG.');
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setSubmitError(null);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoFileInputRef.current) logoFileInputRef.current.value = '';
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setSubmitError(null);

    // Validações manuais extras
    if (!isValidCNPJ(data.cnpj)) {
      setSubmitError('CNPJ inválido');
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('company[name]', data.name);
      formData.append('company[description]', data.description);
      formData.append('company[email_public]', data.emailPublic);
      formData.append('company[phone]', data.phone);
      formData.append('company[address]', data.address);
      formData.append('company[state]', data.state);
      formData.append('company[city]', data.city);
      formData.append('company[cnpj]', data.cnpj.replace(/\D/g, ''));
      formData.append('company[status]', 'pending');
      formData.append('company[terms_accepted]', String(data.termsAccepted));
      formData.append('company[newsletter_opt_in]', String(data.newsletter));
      
      if (logoFile) {
        formData.append('company[logo]', logoFile);
      }

      await fetchApi('/companies', {
        method: 'POST',
        body: formData
      });
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Registration error:', err);
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

  const handleReset = () => {
    setIsSuccess(false);
    reset();
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex flex-col items-center justify-center h-full text-center p-8 lg:p-12 overflow-y-auto custom-scrollbar"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
          className="mb-6 rounded-full bg-green-100 p-6"
        >
          <CheckCircle className="h-16 w-16 text-emerald-600" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-slate-900 mb-2"
        >
          Cadastro enviado com sucesso!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-slate-600 mb-8 max-w-md"
        >
          Sua empresa foi cadastrada para análise e aprovação. Você receberá um e-mail de confirmação em breve.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-sm"
        >
          <Button
            onClick={() => router.push('/')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Voltar para Home
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full"
          >
            Cadastrar outra empresa
            <RefreshCcw className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-center p-8 lg:p-12 overflow-y-auto custom-scrollbar">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Cadastro de Empresa</h2>
        <p className="text-slate-600">Preencha os dados abaixo para cadastrar sua empresa.</p>
      </div>

      <div className="flex flex-col items-center justify-center mb-6">
        <div className="relative group cursor-pointer" onClick={() => logoFileInputRef.current?.click()}>
          <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 border-dashed ${logoPreview ? 'border-emerald-500' : 'border-slate-300'} overflow-hidden bg-slate-50 hover:bg-slate-100 transition-colors`}>
            {logoPreview ? (
              <Image src={logoPreview} alt="Logo Preview" width={96} height={96} className="object-cover w-full h-full" />
            ) : (
              <Building className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <input
            type="file"
            ref={logoFileInputRef}
            className="hidden"
            accept="image/png, image/jpeg, image/svg+xml"
            onChange={handleLogoChange}
          />
          {logoPreview && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeLogo(); }}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-2">Logo da Empresa (opcional, máx 2MB)</p>
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
