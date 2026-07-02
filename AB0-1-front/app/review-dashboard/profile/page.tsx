'use client';

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Camera, ChevronRight, Sparkles, Linkedin, Twitter } from 'lucide-react';
import { useDashboardContext } from '../DashboardLayoutClient';
import { reviewsApi, usersApi, Review } from '@/lib/api';
import {
  prepareAvatarFileForUpload,
  uploadUserAvatar,
  AvatarUploadClientError,
} from '@/lib/avatar-upload';
import { getApiErrorMessage } from '@/lib/api-error';

const createEmptyAdditionalData = () => ({
  pronouns: '',
  headline: '',
  aboutMe: '',
  industry: '',
  jobTitle: '',
  companyName: '',
  companySize: '',
  linkedinUrl: '',
  twitterUrl: '',
  consumerType: 'residencial',
  mainInterest: 'energia_solar',
});

const createDefaultPrivacySettings = () => ({
  publicProfile: true,
  showOnRanking: true,
  allowMessages: true,
  showCity: true,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function initialsFromName(name?: string | null) {
  const safeName = name?.trim() || 'Usuário';
  return safeName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function ProfileDetailsPage() {
  const { user, refreshAuth } = useAuth();
  const { solutions } = useDashboardContext();
  const router = useRouter();

  // Estados dos dados reais (via API)
  const [personalData, setPersonalData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
  });

  // Estados dos dados adicionais (via localStorage com fallback G2)
  const [additionalData, setAdditionalData] = useState(createEmptyAdditionalData);

  // Estados de privacidade
  const [privacySettings, setPrivacySettings] = useState(createDefaultPrivacySettings);

  // Estados de upload de avatar
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState<string | null>(null);
  const [pendingAvatarPreviewUrl, setPendingAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const pendingPreviewObjectUrlRef = useRef<string | null>(null);

  const fetchUserReviews = useCallback(async () => {
    try {
      const reviews = await reviewsApi.getAll({ mine: true, limit: 10 });
      setUserReviews(Array.isArray(reviews) ? reviews : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    setPersonalData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      city: user.city || '',
      state: user.state || '',
    });
    setAvatarDisplayUrl(user.avatar_url || null);
    void fetchUserReviews();

    const cached = localStorage.getItem(`reviewer_extra_${user.id}`);
    if (cached) {
      try {
        const parsed: unknown = JSON.parse(cached);
        setAdditionalData({
          ...createEmptyAdditionalData(),
          ...(isRecord(parsed) ? parsed : {}),
        });
      } catch (error) {
        console.error('[Profile] Invalid cached profile details', error);
        setAdditionalData(createEmptyAdditionalData());
      }
    } else {
      setAdditionalData(createEmptyAdditionalData());
    }

    const cachedPrivacy = localStorage.getItem(`reviewer_privacy_${user.id}`);
    if (cachedPrivacy) {
      try {
        const parsed: unknown = JSON.parse(cachedPrivacy);
        setPrivacySettings({
          ...createDefaultPrivacySettings(),
          ...(isRecord(parsed) ? parsed : {}),
        });
      } catch (error) {
        console.error('[Profile] Invalid cached privacy settings', error);
        setPrivacySettings(createDefaultPrivacySettings());
      }
    } else {
      setPrivacySettings(createDefaultPrivacySettings());
    }
  }, [user, fetchUserReviews]);

  const handleAvatarFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setAvatarError(null);
      const preparedFile = await prepareAvatarFileForUpload(file);

      if (pendingPreviewObjectUrlRef.current) {
        URL.revokeObjectURL(pendingPreviewObjectUrlRef.current);
      }

      const previewUrl = URL.createObjectURL(preparedFile);
      pendingPreviewObjectUrlRef.current = previewUrl;
      setPendingAvatarPreviewUrl(previewUrl);
      // Auto upload ao selecionar
      await handleAvatarUpload(preparedFile);
    } catch (err: unknown) {
      const message =
        err instanceof AvatarUploadClientError ? err.message : 'Falha ao processar arquivo.';
      setAvatarError(message);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setAvatarUploading(true);
    setAvatarUploadProgress(10);

    try {
      setAvatarUploadProgress(30);
      const uploadResult = await uploadUserAvatar(user.id, file, {
        onProgress: (progress) => setAvatarUploadProgress(progress.percent),
      });
      const publicUrl = uploadResult.avatarUrl;
      setAvatarUploadProgress(80);

      // Atualizar no banco
      await usersApi.update(user.id, { avatar_url: publicUrl });
      setAvatarUploadProgress(100);

      await refreshAuth();
      setAvatarDisplayUrl(publicUrl);
      setPendingAvatarPreviewUrl(null);

      toast({
        title: 'Sucesso',
        description: 'Foto de perfil atualizada com sucesso!',
      });
    } catch (err) {
      console.error(err);
      setAvatarError('Erro no upload da imagem.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveAll = async () => {
    if (!user || saving) return;

    const normalizedAdditionalData = {
      ...additionalData,
      aboutMe: additionalData.aboutMe.trim(),
    };
    setSaving(true);

    try {
      // 1. Salvar dados principais na API
      await usersApi.update(user.id, {
        name: personalData.name,
        email: personalData.email,
        phone: personalData.phone,
        city: personalData.city,
        state: personalData.state,
      });

      // 2. Salvar dados adicionais no localStorage
      localStorage.setItem(`reviewer_extra_${user.id}`, JSON.stringify(normalizedAdditionalData));

      // 3. Salvar privacidade no localStorage
      localStorage.setItem(`reviewer_privacy_${user.id}`, JSON.stringify(privacySettings));

      setAdditionalData(normalizedAdditionalData);

      try {
        await refreshAuth();
      } catch (refreshError) {
        console.error('[Profile] Profile saved, but auth refresh failed', refreshError);
      }

      toast({
        title: 'Perfil Atualizado',
        description: 'Todas as alterações foram salvas com sucesso.',
      });
    } catch (err) {
      toast({
        title: 'Erro ao salvar',
        description: getApiErrorMessage(err, 'Falha ao atualizar dados principais.'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;
  const userInitials = initialsFromName(user.name);
  const avatarSource = pendingAvatarPreviewUrl || avatarDisplayUrl || undefined;

  // Checklist de Completude do Perfil
  const checklist = [
    { label: 'Dados pessoais completos', done: !!(user.name && user.email && user.phone) },
    { label: 'Foto de perfil adicionada', done: !!avatarDisplayUrl },
    { label: 'Localização informada', done: !!(user.city && user.state) },
    { label: 'Social LinkedIn informado', done: !!additionalData.linkedinUrl },
    { label: 'Soluções sustentáveis informadas', done: solutions.length > 0 },
    { label: 'Publicou a 1ª avaliação', done: userReviews.length > 0 },
  ];

  const doneCount = checklist.filter((item) => item.done).length;
  const profileCompletion = Math.round((doneCount / checklist.length) * 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <Link href="/review-dashboard" className="hover:text-emerald-600 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-400">Meu Perfil</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-700">Detalhes do Perfil</span>
      </div>

      {/* Card Superior Opcional: Soluções que você usa */}
      {solutions.length === 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-amber-50 p-5 shadow-sm">
          <div className="flex gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Complete seu perfil: Soluções que você utiliza
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Cadastre as marcas ou tecnologias que você possui (inversores, painéis ou EVs) para
                ganhar badges e recomendações.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shrink-0"
            asChild
          >
            <Link href="/review-dashboard#solutions">Cadastrar Soluções</Link>
          </Button>
        </div>
      )}

      {/* Card Principal: Detalhes do Perfil */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Coluna do Formulário (2/3 de largura) */}
        <div className="xl:col-span-8 space-y-6">
          <Card className="rounded-2xl border-gray-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-100 p-6">
              <CardTitle className="text-lg font-bold text-gray-900">Detalhes do Perfil</CardTitle>
              <CardDescription className="text-xs text-gray-400">
                Gerencie suas informações pessoais, profissionais e links sociais para sua
                reputação.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Foto do Perfil (Upload Compacto) */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50/50 p-4 rounded-xl border border-gray-100">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                    <AvatarImage src={avatarSource} alt={user.name} />
                    <AvatarFallback className="bg-emerald-50 text-emerald-950 font-bold text-lg">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white border-2 border-white hover:bg-emerald-700 transition-colors shadow"
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleAvatarFileSelect}
                  />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-sm font-bold text-gray-900">Sua Foto de Perfil</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    JPG ou PNG de até 5MB. Fotos nítidas aumentam a confiabilidade da sua avaliação.
                  </p>
                </div>
                {avatarUploading && (
                  <div className="ml-auto flex items-center gap-2 text-xs font-semibold text-emerald-600">
                    <span className="animate-spin">🔄</span>
                    Enviando ({avatarUploadProgress}%)
                  </div>
                )}
              </div>

              {avatarError && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs font-semibold text-red-700">
                  {avatarError}
                </div>
              )}

              {/* Seção 1: Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Dados Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="profile-name" className="text-xs font-semibold text-gray-500">
                      Nome Completo
                    </Label>
                    <Input
                      id="profile-name"
                      placeholder="Felipe Henrique"
                      value={personalData.name}
                      onChange={(e) => setPersonalData({ ...personalData, name: e.target.value })}
                      className="h-10 rounded-lg border-gray-200 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="profile-email" className="text-xs font-semibold text-gray-500">
                      E-mail
                    </Label>
                    <Input
                      id="profile-email"
                      type="email"
                      placeholder="exemplo@email.com"
                      value={personalData.email}
                      onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                      className="h-10 rounded-lg border-gray-200 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="profile-phone" className="text-xs font-semibold text-gray-500">
                      Telefone
                    </Label>
                    <Input
                      id="profile-phone"
                      placeholder="(11) 99999-9999"
                      value={personalData.phone}
                      onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                      className="h-10 rounded-lg border-gray-200 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="profile-city" className="text-xs font-semibold text-gray-500">
                        Cidade
                      </Label>
                      <Input
                        id="profile-city"
                        placeholder="São Paulo"
                        value={personalData.city}
                        onChange={(e) => setPersonalData({ ...personalData, city: e.target.value })}
                        className="h-10 rounded-lg border-gray-200 focus-visible:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="profile-state"
                        className="text-xs font-semibold text-gray-500"
                      >
                        Estado (UF)
                      </Label>
                      <Input
                        id="profile-state"
                        placeholder="SP"
                        value={personalData.state}
                        onChange={(e) =>
                          setPersonalData({ ...personalData, state: e.target.value })
                        }
                        className="h-10 rounded-lg border-gray-200 focus-visible:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label
                      htmlFor="profile-pronouns"
                      className="text-xs font-semibold text-gray-500"
                    >
                      Pronomes (Opcional)
                    </Label>
                    <Input
                      id="profile-pronouns"
                      placeholder="Ele/Dele"
                      value={additionalData.pronouns}
                      onChange={(e) =>
                        setAdditionalData({ ...additionalData, pronouns: e.target.value })
                      }
                      className="h-10 rounded-lg border-gray-200 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="profile-headline"
                      className="text-xs font-semibold text-gray-500"
                    >
                      Título / Headline
                    </Label>
                    <Input
                      id="profile-headline"
                      placeholder="Especialista em Engenharia Solar"
                      value={additionalData.headline}
                      onChange={(e) =>
                        setAdditionalData({ ...additionalData, headline: e.target.value })
                      }
                      className="h-10 rounded-lg border-gray-200 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="profile-aboutme" className="text-xs font-semibold text-gray-500">
                    Biografia / Sobre você
                  </Label>
                  <textarea
                    id="profile-aboutme"
                    placeholder="Escreva um breve resumo sobre sua jornada profissional com energia limpa e sustentabilidade..."
                    rows={4}
                    value={additionalData.aboutMe}
                    onChange={(e) =>
                      setAdditionalData({ ...additionalData, aboutMe: e.target.value })
                    }
                    className="w-full text-sm p-3 rounded-lg border border-gray-200 focus-visible:ring-emerald-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <Separator />

              {/* Seção 2: Informações de Consumo e Profissional */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Interesses e Atuação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label
                      htmlFor="profile-consumertype"
                      className="text-xs font-semibold text-gray-500"
                    >
                      Tipo de Consumidor
                    </Label>
                    <select
                      id="profile-consumertype"
                      value={additionalData.consumerType}
                      onChange={(e) =>
                        setAdditionalData({ ...additionalData, consumerType: e.target.value })
                      }
                      className="w-full text-sm h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="residencial">Residencial</option>
                      <option value="comercial">Comercial</option>
                      <option value="industrial">Industrial</option>
                      <option value="rural">Rural</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="profile-interest"
                      className="text-xs font-semibold text-gray-500"
                    >
                      Interesse Principal
                    </Label>
                    <select
                      id="profile-interest"
                      value={additionalData.mainInterest}
                      onChange={(e) =>
                        setAdditionalData({ ...additionalData, mainInterest: e.target.value })
                      }
                      className="w-full text-sm h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="energia_solar">Energia Solar Fotovoltaica</option>
                      <option value="mobilidade_eletrica">Mobilidade Elétrica (EVs)</option>
                      <option value="bateria_armazenamento">Bateria & Armazenamento</option>
                      <option value="eficiencia_energetica">Eficiência Energética</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="profile-job" className="text-xs font-semibold text-gray-500">
                      Cargo / Função
                    </Label>
                    <Input
                      id="profile-job"
                      placeholder="Diretor Técnico"
                      value={additionalData.jobTitle}
                      onChange={(e) =>
                        setAdditionalData({ ...additionalData, jobTitle: e.target.value })
                      }
                      className="h-10 rounded-lg border-gray-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="profile-companyname"
                      className="text-xs font-semibold text-gray-500"
                    >
                      Empresa atual
                    </Label>
                    <Input
                      id="profile-companyname"
                      placeholder="GreenTech Solar"
                      value={additionalData.companyName}
                      onChange={(e) =>
                        setAdditionalData({ ...additionalData, companyName: e.target.value })
                      }
                      className="h-10 rounded-lg border-gray-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="profile-companysize"
                      className="text-xs font-semibold text-gray-500"
                    >
                      Tamanho da empresa
                    </Label>
                    <select
                      id="profile-companysize"
                      value={additionalData.companySize}
                      onChange={(e) =>
                        setAdditionalData({ ...additionalData, companySize: e.target.value })
                      }
                      className="w-full text-sm h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">Selecione...</option>
                      <option value="1-10">1-10 funcionários</option>
                      <option value="11-50">11-50 funcionários</option>
                      <option value="51-200">51-200 funcionários</option>
                      <option value="201-500">201-500 funcionários</option>
                      <option value="500+">Mais de 500</option>
                    </select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Seção 3: Social & Links */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Redes Sociais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label
                      htmlFor="profile-linkedin"
                      className="text-xs font-semibold text-gray-500 flex items-center gap-1.5"
                    >
                      <Linkedin className="h-3.5 w-3.5 text-blue-600" /> LinkedIn Profile URL
                    </Label>
                    <Input
                      id="profile-linkedin"
                      placeholder="https://linkedin.com/in/usuario"
                      value={additionalData.linkedinUrl}
                      onChange={(e) =>
                        setAdditionalData({ ...additionalData, linkedinUrl: e.target.value })
                      }
                      className="h-10 rounded-lg border-gray-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="profile-twitter"
                      className="text-xs font-semibold text-gray-500 flex items-center gap-1.5"
                    >
                      <Twitter className="h-3.5 w-3.5 text-sky-500" /> Twitter Profile URL
                    </Label>
                    <Input
                      id="profile-twitter"
                      placeholder="https://twitter.com/usuario"
                      value={additionalData.twitterUrl}
                      onChange={(e) =>
                        setAdditionalData({ ...additionalData, twitterUrl: e.target.value })
                      }
                      className="h-10 rounded-lg border-gray-200"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Privacidade e Visibilidade */}
          <Card className="rounded-2xl border-gray-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-100 p-6">
              <CardTitle className="text-lg font-bold text-gray-900">
                Privacidade & Visibilidade
              </CardTitle>
              <CardDescription className="text-xs text-gray-400">
                Gerencie como suas informações de reputação são expostas na comunidade.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                {
                  key: 'publicProfile',
                  label: 'Perfil público ativo',
                  desc: 'Permite que outros usuários vejam suas conquistas e avaliações completas.',
                },
                {
                  key: 'showOnRanking',
                  label: 'Exibir no Ranking Regional',
                  desc: 'Compartilhe sua pontuação de Green Score no ranking regional do Avalia Solar.',
                },
                {
                  key: 'allowMessages',
                  label: 'Receber mensagens de empresas',
                  desc: 'Permite que empresas avaliadas enviem propostas ou mensagens diretas a você.',
                },
                {
                  key: 'showCity',
                  label: 'Mostrar cidade e estado no perfil público',
                  desc: 'Exibe sua localização regional no seu card público.',
                },
              ].map((opt) => (
                <div
                  key={opt.key}
                  className="flex items-start justify-between gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          privacySettings[opt.key as keyof typeof privacySettings]
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {privacySettings[opt.key as keyof typeof privacySettings]
                          ? 'Ativo'
                          : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-normal">{opt.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPrivacySettings({
                        ...privacySettings,
                        [opt.key]: !privacySettings[opt.key as keyof typeof privacySettings],
                      })
                    }
                    className={`flex h-6 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                      privacySettings[opt.key as keyof typeof privacySettings]
                        ? 'bg-emerald-600'
                        : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                        privacySettings[opt.key as keyof typeof privacySettings]
                          ? 'translate-x-6'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Botão de Ação de Salvar Tudo */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/review-dashboard')}
              className="rounded-xl border-gray-200 font-bold"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAll}
              className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700 min-w-[140px]"
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>

        {/* Coluna Lateral: Checklist / Completude de Perfil (1/3 de largura) */}
        <div className="xl:col-span-4 space-y-6">
          <Card className="rounded-2xl border-gray-200 bg-white shadow-sm overflow-hidden sticky top-[88px]">
            <CardHeader className="border-b border-gray-100 p-6 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Complete seu perfil
                </CardTitle>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  {profileCompletion}%
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Progress value={profileCompletion} className="h-2.5 bg-slate-100" />
                <p className="text-xs text-gray-400">
                  Perfil completo garante selo verificado e melhora o seu engajamento no Avalia
                  Solar.
                </p>
              </div>

              <Separator />

              {/* Checklist */}
              <div className="space-y-3.5">
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        item.done ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {item.done ? '✓' : idx + 1}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        item.done ? 'text-gray-500 line-through' : 'text-gray-700'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {profileCompletion < 100 && (
                <>
                  <Separator />
                  <div className="flex gap-2 rounded-xl bg-emerald-50/50 border border-emerald-100 p-3 text-[11px] text-emerald-850">
                    <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p className="font-bold">Dica da Comunidade</p>
                      <p className="mt-0.5 text-emerald-700 leading-normal">
                        Perfis com o LinkedIn verificado recebem <strong>votos úteis</strong> 4.2x
                        mais rápido de outros consumidores!
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
