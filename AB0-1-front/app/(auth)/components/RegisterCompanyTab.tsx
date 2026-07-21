'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Loader2, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { fetchApi } from '@/lib/api';
import { formatPhone } from '@/app/dashboard/utils';
import { useRouter } from 'next/navigation';
import { isCorporateEmail } from '@/lib/utils';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface RegisterCompanyFormData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  phone: string;
  termsAccepted: boolean;
}

type RegistrationError = {
  message?: string;
};

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome é obrigatório'),
    email: z.string().email('E-mail inválido').refine(isCorporateEmail, {
      message: 'Por favor, use um e-mail corporativo (não @gmail, @hotmail, etc.)',
    }),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    passwordConfirmation: z.string(),
    phone: z.string().min(10, 'Telefone inválido'),
    termsAccepted: z.boolean().refine((v) => v === true, {
      message: 'Você deve aceitar os termos',
    }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Senhas não conferem',
    path: ['passwordConfirmation'],
  });

export default function RegisterCompanyTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterCompanyFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      termsAccepted: false,
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterCompanyFormData) => {
    setIsLoading(true);
    setSubmitError(null);

    if (!isCorporateEmail(data.email)) {
      setSubmitError(
        'Por favor, utilize um e-mail corporativo. E-mails públicos (Gmail, Hotmail, etc.) não são permitidos para cadastro de empresas.'
      );
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('user[name]', data.name);
      formData.append('user[email]', data.email);
      formData.append('user[password]', data.password);
      formData.append('user[password_confirmation]', data.passwordConfirmation);
      formData.append('user[phone]', data.phone);
      formData.append('user[role]', 'company');
      formData.append('terms_accepted', String(data.termsAccepted));

      await fetchApi('/auth/register', {
        method: 'POST',
        body: formData,
      });
      setIsSuccess(true);
    } catch (error: unknown) {
      const err = error as RegistrationError;
      const message = err.message || 'Ocorreu um erro ao processar o cadastro. Tente novamente.';
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

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex h-full flex-col items-center justify-center overflow-y-auto px-5 py-8 text-center custom-scrollbar sm:px-10 md:px-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
          className="mb-6 rounded-full bg-green-100 p-6"
        >
          <CheckCircle className="h-16 w-16 text-blue-600" />
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
          Sua conta de empresa foi criada e está aguardando aprovação administrativa. Você receberá
          um e-mail assim que sua conta for ativada.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-sm"
        >
          <Button
            onClick={() => router.push('/')}
            className="w-full rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Voltar para Home
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-5 pb-8 pt-4 custom-scrollbar sm:px-10 md:px-12">
      <div className="mx-auto w-full max-w-[430px]">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Cadastro para empresas
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Use seu e-mail corporativo para gerenciar sua empresa.
          </p>
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700 font-semibold text-sm">
              Nome Completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Seu nome"
              className={`h-11 rounded-md bg-white text-slate-900 border-slate-200 focus:bg-white focus-visible:ring-blue-500/25 ${errors.name ? 'border-red-500' : ''}`}
              {...register('name', {
                required: 'Nome é obrigatório',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              })}
            />
            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 font-semibold text-sm">
              E-mail Corporativo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="voce@suaempresa.com"
              className={`h-11 rounded-md bg-white text-slate-900 border-slate-200 focus:bg-white focus-visible:ring-blue-500/25 ${errors.email ? 'border-red-500' : ''}`}
              {...register('email', {
                required: 'E-mail é obrigatório',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'E-mail inválido',
                },
              })}
            />
            {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-700 font-semibold text-sm">
              Telefone / WhatsApp <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              placeholder="(00) 00000-0000"
              className={`h-11 rounded-md bg-white text-slate-900 border-slate-200 focus:bg-white focus-visible:ring-blue-500/25 ${errors.phone ? 'border-red-500' : ''}`}
              {...register('phone', {
                required: 'Telefone é obrigatório',
              })}
              onChange={handlePhoneChange}
            />
            {errors.phone && <span className="text-xs text-red-500">{errors.phone.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 font-semibold text-sm">
              Senha <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              className={`h-11 rounded-md bg-white text-slate-900 border-slate-200 focus:bg-white focus-visible:ring-blue-500/25 ${errors.password ? 'border-red-500' : ''}`}
              {...register('password', {
                required: 'Senha é obrigatória',
                minLength: { value: 8, message: 'Mínimo 8 caracteres' },
              })}
            />
            {errors.password && (
              <span className="text-xs text-red-500">{errors.password.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirmation" className="text-slate-700 font-semibold text-sm">
              Confirmar Senha <span className="text-red-500">*</span>
            </Label>
            <Input
              id="passwordConfirmation"
              type="password"
              placeholder="********"
              className={`h-11 rounded-md bg-white text-slate-900 border-slate-200 focus:bg-white focus-visible:ring-blue-500/25 ${errors.passwordConfirmation ? 'border-red-500' : ''}`}
              {...register('passwordConfirmation', {
                required: 'Confirmação de senha é obrigatória',
                validate: (val) => val === password || 'As senhas não conferem',
              })}
            />
            {errors.passwordConfirmation && (
              <span className="text-xs text-red-500">{errors.passwordConfirmation.message}</span>
            )}
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
                  Aceito os Termos de Uso e Política de Privacidade{' '}
                  <span className="text-red-500">*</span>
                </Label>
                {errors.termsAccepted && (
                  <span className="text-xs text-red-500">{errors.termsAccepted.message}</span>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full rounded-md bg-blue-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Cadastrando...
              </>
            ) : (
              'Criar Conta de Empresa'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
