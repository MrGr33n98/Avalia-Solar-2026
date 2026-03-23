'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Loader2, AlertCircle, CheckCircle, ArrowRight, Upload, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { fetchApi } from '@/lib/api';
import { formatPhone } from '@/app/dashboard/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

interface FormData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  phone: string;
  city: string;
  state: string;
  termsAccepted: boolean;
}

export default function RegisterUserTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    },
  });

  const password = watch('password');
  const termsAccepted = watch('termsAccepted');

  useEffect(() => {
    register('termsAccepted', { required: 'Você precisa aceitar os termos para continuar.' });
  }, [register]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setSubmitError('A imagem deve ter no máximo 2MB');
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setSubmitError('Formato inválido. Use JPG ou PNG.');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setSubmitError(null);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('user[name]', data.name);
      formData.append('user[email]', data.email);
      formData.append('user[password]', data.password);
      formData.append('user[password_confirmation]', data.passwordConfirmation);
      formData.append('user[city]', data.city);
      if (data.state) formData.append('user[state]', data.state);
      if (data.phone) formData.append('user[phone]', data.phone);
      formData.append('terms_accepted', data.termsAccepted ? 'true' : 'false');
      if (avatarFile) formData.append('user[avatar]', avatarFile);

      await fetchApi('/auth/register', {
        method: 'POST',
        body: formData,
      });
      setIsSuccess(true);
      reset({
        name: '',
        email: '',
        password: '',
        passwordConfirmation: '',
        phone: '',
        city: '',
        state: '',
        termsAccepted: false,
      });
      removeAvatar();
    } catch (err: any) {
      const status = err?.context?.status;
      const message = err?.message || 'Ocorreu um erro ao processar o cadastro.';
      const apiErrors = err?.context?.details?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length) {
        setSubmitError(apiErrors.join(' | '));
      } else if (status === 422 || `${message}`.includes('[422]')) {
        setSubmitError('Verifique os campos e tente novamente.');
      } else {
        setSubmitError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('phone', formatted);
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full text-center p-8 lg:p-12 overflow-y-auto custom-scrollbar"
      >
        <div className="mb-6 rounded-full bg-green-100 p-6">
          <CheckCircle className="h-16 w-16 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Conta criada com sucesso!</h2>
        <p className="text-slate-600 mb-8 max-w-md">
          Bem-vindo! Agora você pode avaliar empresas e compartilhar suas experiências.
        </p>
        <Button onClick={() => window.location.reload()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
          Fazer Login <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-center p-8 lg:p-12 overflow-y-auto custom-scrollbar">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Criar Conta</h2>
        <p className="text-slate-600">Junte-se a nós para avaliar e encontrar as melhores empresas.</p>
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
        {/* Avatar Upload */}
        <div className="flex justify-center mb-6">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 border-dashed ${avatarPreview ? 'border-emerald-500' : 'border-slate-300'} overflow-hidden bg-slate-50 hover:bg-slate-100 transition-colors`}>
              {avatarPreview ? (
                <Image src={avatarPreview} alt="Preview" width={96} height={96} className="object-cover w-full h-full" />
              ) : (
                <User className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png, image/jpeg"
              onChange={handleAvatarChange}
            />
            {avatarPreview && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeAvatar(); }}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-center text-slate-500 -mt-2 mb-4">Foto de perfil (opcional, máx 2MB)</p>

        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo *</Label>
          <Input id="name" {...register('name', { required: 'Nome é obrigatório', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })} className={errors.name ? 'border-red-500' : ''} />
          {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail *</Label>
          <Input id="email" type="email" {...register('email', { required: 'E-mail é obrigatório', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'E-mail inválido' } })} className={errors.email ? 'border-red-500' : ''} />
          {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Cidade *</Label>
            <Input id="city" {...register('city', { required: 'Cidade é obrigatória' })} className={errors.city ? 'border-red-500' : ''} />
            {errors.city && <span className="text-xs text-red-500">{errors.city.message}</span>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">Estado (UF)</Label>
            <Select onValueChange={(val) => setValue('state', val)}>
              <SelectTrigger id="state">
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone / WhatsApp</Label>
          <Input id="phone" {...register('phone')} onChange={handlePhoneChange} placeholder="(00) 00000-0000" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha *</Label>
          <Input
            id="password"
            type="password"
            {...register('password', {
              required: 'Senha é obrigatória',
              validate: (val) => {
                if (!val) return 'Senha é obrigatória';
                if (val.length < 8) return 'Mínimo 8 caracteres';
                if (!/[A-Z]/.test(val)) return 'Inclua ao menos 1 letra maiúscula';
                if (!/[a-z]/.test(val)) return 'Inclua ao menos 1 letra minúscula';
                if (!/\d/.test(val)) return 'Inclua ao menos 1 número';
                return true;
              },
            })}
            className={errors.password ? 'border-red-500' : ''}
          />
          {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
          <Input id="confirmPassword" type="password" {...register('passwordConfirmation', { validate: (val) => val === password || 'As senhas não conferem' })} className={errors.passwordConfirmation ? 'border-red-500' : ''} />
          {errors.passwordConfirmation && <span className="text-xs text-red-500">{errors.passwordConfirmation.message}</span>}
        </div>

        <div className="flex items-start space-x-3 pt-2">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setValue('termsAccepted', !!checked, { shouldValidate: true })}
          />
          <div className="space-y-1">
            <Label htmlFor="terms" className="font-medium text-slate-700">
              Aceito os termos de uso e privacidade
            </Label>
            <p className="text-xs text-slate-500">
              Ao continuar, você concorda com os{' '}
              <a href="/terms" className="text-emerald-600 hover:text-emerald-700 underline">
                Termos de Uso
              </a>{' '}
              e a{' '}
              <a href="/privacy" className="text-emerald-600 hover:text-emerald-700 underline">
                Política de Privacidade
              </a>.
            </p>
            {errors.termsAccepted && (
              <span className="text-xs text-red-500">
                {errors.termsAccepted.message || 'Você precisa aceitar os termos para continuar.'}
              </span>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white mt-4" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cadastrando...</> : 'Criar Conta'}
        </Button>
      </form>
    </div>
  );
}
