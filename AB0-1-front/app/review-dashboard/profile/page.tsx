'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { ChangeEvent, ChangeEventHandler } from 'react';
import Image from 'next/image';
import { ReviewerPageHeader } from '@/components/review-dashboard/layout/ReviewerPageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useOptionalDashboardContext } from '../DashboardLayoutClient';
import { reviewerProfileApi, reviewerSolutionsApi, usersApi } from '@/lib/api';
import type { UserSolution } from '@/components/profile/UserSolutionChip';
import { buildProfilePatch } from '@/lib/profile-delta';
import { toast } from 'sonner';
import { track } from '@/lib/analytics/lazy';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Globe,
  Linkedin,
  Instagram,
  CheckCircle2,
  CircleDot,
  Eye,
  Save,
  X,
} from 'lucide-react';

export default function MeuPerfilPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isCreatorStudio = pathname?.startsWith('/creator-studio');
  const { user } = useAuth();
  const dashboard = useOptionalDashboardContext();
  const summary = dashboard?.summary ?? null;
  const reviews = dashboard?.reviews ?? [];
  const onRefresh = dashboard?.onRefresh ?? (async () => undefined);
  const [standaloneSolutions, setStandaloneSolutions] = useState<UserSolution[]>([]);
  const solutions = dashboard?.solutions ?? standaloneSolutions;
  const [saving, setSaving] = useState(false);
  const [publicSaving, setPublicSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [publicSlug, setPublicSlug] = useState('');
  const [completion, setCompletion] = useState(summary?.profile?.completion_percent ?? 0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>(
    'idle'
  );
  const avatarObjectUrl = useRef<string | null>(null);
  const bannerObjectUrl = useRef<string | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  type ReviewerProfileData = {
    public_slug?: string | null;
    bio?: string;
    company_name?: string;
    public_headline?: string;
    public_bio?: string;
    public_banner_url?: string;
    whatsapp_url?: string;
    avatar_url?: string;
    creator_enabled?: boolean;
    profession?: string;
    linkedin_url?: string;
    instagram_url?: string;
    website_url?: string;
  };

  const [profileData, setProfileData] = useState<ReviewerProfileData>({});
  const profileUser = user as (typeof user & { profession?: string }) | null;
  useEffect(() => {
    if (dashboard) return;
    void reviewerSolutionsApi
      .list()
      .then((response) => {
        const data = Array.isArray(response)
          ? response
          : (response as { data?: UserSolution[] }).data || [];
        setStandaloneSolutions(data);
      })
      .catch(() => setStandaloneSolutions([]));
  }, [dashboard]);

  useEffect(() => {
    void reviewerProfileApi
      .get()
      .then((payload) => {
        setProfileData(payload.profile || {});
        setCompletion(payload.completion?.percent ?? 0);
        setPublicSlug(String(payload.profile?.public_slug || ''));
      })
      .catch(() => toast.error('Não foi possível carregar perfil profissional.'));
  }, []);

  const handlePublicBannerUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Banner excede 8 MB.');
      return;
    }
    const previousBannerUrl = profileData.public_banner_url;
    setBannerUploading(true);
    if (bannerObjectUrl.current) URL.revokeObjectURL(bannerObjectUrl.current);
    bannerObjectUrl.current = URL.createObjectURL(file);
    setProfileData((current) => ({
      ...current,
      public_banner_url: bannerObjectUrl.current || current.public_banner_url,
    }));
    try {
      const result = (await reviewerProfileApi.uploadPublicBanner(file)) as {
        profile?: ReviewerProfileData;
        completion?: { percent?: number };
      };
      setProfileData((current) => ({ ...current, ...(result.profile || {}) }));
      setCompletion(result.completion?.percent ?? completion);
      toast.success('Banner atualizado.');
    } catch {
      setProfileData((current) => ({ ...current, public_banner_url: previousBannerUrl }));
      toast.error('Não foi possível enviar o banner.');
    } finally {
      setBannerUploading(false);
      if (bannerObjectUrl.current) {
        URL.revokeObjectURL(bannerObjectUrl.current);
        bannerObjectUrl.current = null;
      }
    }
  };

  const activatePublicProfile = async () => {
    setPublicSaving(true);
    try {
      const result = (await reviewerProfileApi.update({
        creator_enabled: true,
        public_headline: profileData.public_headline || '',
        public_bio: profileData.public_bio || '',
      })) as { profile?: ReviewerProfileData; completion?: { percent?: number } };
      const nextProfile = result.profile || {};
      setProfileData((current) => ({ ...current, ...nextProfile, creator_enabled: true }));
      setPublicSlug(String(nextProfile.public_slug || profileData.public_slug || ''));
      setCompletion(result.completion?.percent ?? completion);
      if (nextProfile.public_slug) router.prefetch(`/creators/${nextProfile.public_slug}`);
      toast.success('Perfil público ativado.');
    } catch {
      toast.error('Não foi possível ativar perfil público.');
    } finally {
      setPublicSaving(false);
    }
  };

  const copyPublicProfileUrl = async () => {
    if (!publicSlug) return;
    await navigator.clipboard.writeText(`${window.location.origin}/creators/${publicSlug}`);
    toast.success('Link copiado.');
  };

  const reviewsCount = reviews.length;
  const profileItems = [
    { label: 'Informações pessoais', done: !!(user?.name && user?.email) },
    { label: 'Foto de perfil', done: !!user?.avatar_url },
    {
      label: 'Informações profissionais',
      done: !!(user as { profession?: string } | null)?.profession,
    },
    { label: 'Localização', done: !!(user?.city && user?.state) },
    {
      label: 'Redes sociais',
      done: !!(profileData.linkedin_url || profileData.instagram_url || profileData.website_url),
    },
    { label: 'Soluções que usa', done: solutions.length > 0, detail: `${solutions.length}/5` },
    { label: 'Primeira avaliação', done: reviewsCount > 0 },
  ];

  const profileCompletion = completion || summary?.profile?.completion_percent || 0;

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (avatarObjectUrl.current) URL.revokeObjectURL(avatarObjectUrl.current);
      if (bannerObjectUrl.current) URL.revokeObjectURL(bannerObjectUrl.current);
    };
  }, [dirty]);

  return (
    <div className="space-y-6">
      <ReviewerPageHeader
        title="Meu perfil"
        description="Gerencie suas informações pessoais e profissionais."
        breadcrumbs={
          isCreatorStudio
            ? [{ label: 'Creator Studio', href: '/creator-studio' }, { label: 'Meu perfil' }]
            : [{ label: 'Dashboard', href: '/review-dashboard' }, { label: 'Meu perfil' }]
        }
      />
      <p aria-live="polite" className="text-sm text-slate-500">
        {saveStatus === 'dirty' && 'Alterações não salvas'}
        {saveStatus === 'saving' && 'Salvando...'}
        {saveStatus === 'saved' && 'Salvo agora'}
        {saveStatus === 'error' && 'Não foi possível salvar. Suas alterações continuam nesta tela.'}
      </p>

      <section
        className="rounded-xl border border-slate-200 bg-white p-6"
        aria-labelledby="public-profile-title"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="public-profile-title" className="text-base font-semibold text-slate-900">
              Perfil público
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Mostre sua autoridade, avaliações e soluções em uma URL pública.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${profileData.creator_enabled === true ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}
          >
            {profileData.creator_enabled === true ? 'Público' : 'Desativado'}
          </span>
        </div>
        <div className="mt-4 grid gap-4">
          <FormField
            label="Headline pública"
            name="public_headline"
            value={profileData.public_headline || ''}
            placeholder="Especialista em Energia Solar"
            onChange={(event) => {
              setDirty(true);
              setSaveStatus('dirty');
              setProfileData((current) => ({ ...current, public_headline: event.target.value }));
            }}
          />
          <div className="rounded-lg border border-dashed border-slate-300 p-4">
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="public_banner"
            >
              {bannerUploading ? 'Enviando banner...' : 'Banner do perfil público'}
            </label>
            <input
              id="public_banner"
              type="file"
              disabled={bannerUploading}
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePublicBannerUpload}
              className="block w-full text-sm disabled:opacity-50"
            />
            {profileData.public_banner_url && (
              <Image
                src={profileData.public_banner_url}
                alt="Banner do perfil público"
                width={1200}
                height={320}
                unoptimized
                className="mt-3 h-28 w-full rounded-lg object-cover"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="public_bio">
              Bio pública
            </label>
            <textarea
              id="public_bio"
              name="public_bio"
              value={profileData.public_bio || ''}
              onChange={(event) => {
                setDirty(true);
                setProfileData((current) => ({ ...current, public_bio: event.target.value }));
              }}
              rows={3}
              placeholder="Conte sua experiência..."
              className="w-full rounded-lg border border-slate-200 p-3 text-sm"
            />
          </div>
        </div>
        {publicSlug && (
          <p className="mt-4 break-all rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            URL:{' '}
            <a
              className="font-semibold text-blue-600 underline"
              href={`/creators/${publicSlug}`}
              target="_blank"
              rel="noreferrer"
            >
              {'/creators/' + publicSlug}
            </a>
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={publicSaving}
            onClick={activatePublicProfile}
            className="min-h-11 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {publicSaving ? 'Ativando...' : 'Ativar perfil público'}
          </button>
          {publicSlug && (
            <>
              <a
                href={`/creators/${publicSlug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Pré-visualizar
              </a>
              <button
                type="button"
                onClick={copyPublicProfileUrl}
                className="min-h-11 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Copiar link
              </button>
            </>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Form principal */}
        <form
          className="space-y-6"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!user) return;
            setSaving(true);
            setSaveStatus('saving');
            const data = new FormData(event.currentTarget);
            try {
              await usersApi.update(user.id, {
                name: String(data.get('name') || ''),
                phone: String(data.get('phone') || ''),
                city: String(data.get('city') || ''),
                state: String(data.get('state') || ''),
              });
              const originalProfile = {
                profession: profileData.profession || '',
                bio: profileData.bio || '',
                linkedin_url: profileData.linkedin_url || '',
                instagram_url: profileData.instagram_url || '',
                website_url: profileData.website_url || '',
                whatsapp_url: profileData.whatsapp_url || '',
              };
              const draftProfile = {
                profession: String(data.get('profession') || ''),
                bio: String(data.get('bio') || ''),
                linkedin_url: String(data.get('linkedin') || ''),
                instagram_url: String(data.get('instagram') || ''),
                website_url: String(data.get('website') || ''),
                whatsapp_url: String(data.get('whatsapp') || ''),
              };
              const profilePatch = buildProfilePatch(originalProfile, draftProfile);
              const profileResult = await reviewerProfileApi.update(profilePatch);
              const updatedProfile = (profileResult as { profile?: ReviewerProfileData }).profile;
              if (updatedProfile) setProfileData((current) => ({ ...current, ...updatedProfile }));
              const responseCompletion = (profileResult as { completion?: { percent?: number } })
                .completion;
              if (responseCompletion?.percent !== undefined)
                setCompletion(responseCompletion.percent);
              setDirty(false);
              setSaveStatus('saved');
              await onRefresh();
              track('reviewer_profile_updated', { route: '/review-dashboard/profile' });
              toast.success('Perfil atualizado com sucesso.');
            } catch {
              setSaveStatus('error');
              toast.error(
                'Não foi possível atualizar o perfil. Suas alterações continuam nesta tela.'
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          {/* Informações pessoais */}
          <FormSection title="Informações pessoais">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nome completo" icon={User} name="name" value={user?.name || ''} />
              <FormField
                label="E-mail"
                icon={Mail}
                name="email"
                value={user?.email || ''}
                type="email"
              />
              <FormField
                label="Telefone"
                icon={Phone}
                name="phone"
                value={user?.phone || ''}
                type="tel"
              />
              <FormField label="Data de nascimento" value="" placeholder="dd/mm/aaaa" />
            </div>
          </FormSection>

          {/* Foto de perfil */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Foto de perfil</h3>
            <div className="flex items-center gap-5">
              <div className="relative">
                {avatarPreview || user?.avatar_url ? (
                  <Image
                    src={avatarPreview || user?.avatar_url || ''}
                    alt={user?.name || 'Avatar'}
                    width={80}
                    height={80}
                    unoptimized
                    className="h-20 w-20 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xl font-bold">
                    {(user?.name || 'U').substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={avatarInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('Avatar excede 5 MB.');
                      return;
                    }
                    setAvatarUploading(true);
                    if (avatarObjectUrl.current) URL.revokeObjectURL(avatarObjectUrl.current);
                    avatarObjectUrl.current = URL.createObjectURL(file);
                    setAvatarPreview(avatarObjectUrl.current);
                    try {
                      const avatarResult = (await reviewerProfileApi.uploadAvatar(file)) as {
                        profile?: ReviewerProfileData;
                        user?: { avatar_url?: string };
                      };
                      setAvatarPreview(avatarResult.user?.avatar_url || user?.avatar_url || null);
                      if (avatarResult.profile)
                        setProfileData((current) => ({ ...current, ...avatarResult.profile }));
                      toast.success('Foto atualizada.');
                    } catch {
                      setAvatarPreview(user?.avatar_url || null);
                      if (avatarObjectUrl.current) {
                        URL.revokeObjectURL(avatarObjectUrl.current);
                        avatarObjectUrl.current = null;
                      }
                      toast.error('Não foi possível enviar foto.');
                    } finally {
                      setAvatarUploading(false);
                      if (avatarObjectUrl.current) {
                        URL.revokeObjectURL(avatarObjectUrl.current);
                        avatarObjectUrl.current = null;
                      }
                    }
                  }}
                />
                <p className="text-sm text-slate-600">JPG, PNG ou WebP. Máximo 5 MB.</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => avatarInput.current?.click()}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    {avatarUploading ? 'Enviando... ' : 'Alterar foto'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await reviewerProfileApi.removeAvatar();
                        setAvatarPreview(null);
                        toast.success('Foto removida.');
                      } catch {
                        toast.error('Não foi possível remover foto.');
                      }
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Informações profissionais */}
          <FormSection title="Informações profissionais">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Profissão"
                icon={Briefcase}
                name="profession"
                value={profileData.profession || profileUser?.profession || ''}
              />
              <FormField
                label="Empresa"
                value={profileData.company_name || ''}
                placeholder="Onde você trabalha"
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Sobre você
                </label>
                <textarea
                  name="bio"
                  rows={3}
                  defaultValue={profileData.bio || ''}
                  placeholder="Conte um pouco sobre sua experiência com energia solar..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none"
                />
              </div>
            </div>
          </FormSection>

          {/* Localização */}
          <FormSection title="Localização">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Cidade" icon={MapPin} name="city" value={user?.city || ''} />
              <FormField label="Estado" name="state" value={user?.state || ''} />
              <FormField label="País" value="Brasil" />
            </div>
          </FormSection>

          {/* Redes sociais */}
          <FormSection title="Redes sociais">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="LinkedIn"
                icon={Linkedin}
                name="linkedin"
                value={profileData.linkedin_url || ''}
                placeholder="linkedin.com/in/"
              />
              <FormField
                label="Instagram"
                icon={Instagram}
                name="instagram"
                value={profileData.instagram_url || ''}
                placeholder="@usuario"
              />
              <FormField
                label="WhatsApp"
                icon={Phone}
                name="whatsapp"
                value={profileData.whatsapp_url || ''}
                placeholder="https://wa.me/5511999999999"
              />
              <FormField
                label="Website"
                icon={Globe}
                name="website"
                value={profileData.website_url || ''}
                placeholder="https://"
              />
            </div>
          </FormSection>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (publicSlug) {
                    window.open(`/creators/${publicSlug}`, '_blank', 'noopener,noreferrer');
                  } else {
                    document
                      .getElementById('public-profile-title')
                      ?.scrollIntoView({ behavior: 'smooth' });
                    toast.info('Ative seu perfil público primeiro.');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Eye className="h-4 w-4" />
                Pré-visualizar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                Salvar alterações
              </button>
            </div>
          </div>
        </form>

        {/* Rail lateral — Progress */}
        <div className="space-y-6">
          {/* Progresso do perfil */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3 mb-4">
              {/* Circular progress */}
              <div className="relative h-14 w-14 shrink-0">
                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${(profileCompletion / 100) * 150.8} 150.8`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-900">
                  {profileCompletion}%
                </span>
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">Perfil completo</p>
                <p className="text-xs text-slate-500">
                  {profileCompletion < 100 ? 'Continue assim!' : 'Excelente!'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {profileItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <CircleDot className="h-4 w-4 text-slate-300 shrink-0" />
                  )}
                  <span className="text-sm text-slate-600 flex-1">{item.label}</span>
                  {item.detail && <span className="text-xs text-slate-400">{item.detail}</span>}
                  <span
                    className={`text-xs font-medium ${item.done ? 'text-green-600' : 'text-slate-400'}`}
                  >
                    {item.done ? 'Completo' : 'Pendente'}
                  </span>
                </div>
              ))}
            </div>

            <a
              href="/review-dashboard/profile"
              className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Completar perfil →
            </a>
          </div>

          {/* Dica */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-100 p-2 shrink-0">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">Dica rápida</p>
                <p className="mt-1 text-xs text-blue-700 leading-4">
                  Perfis completos recebem até 2x mais visualizações. Adicione foto, localização e
                  redes sociais.
                </p>
                <a
                  href="/review-dashboard/profile"
                  className="mt-2 inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Saber mais →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-semibold text-slate-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function FormField({
  label,
  icon: Icon,
  value,
  name,
  placeholder,
  type = 'text',
  onChange,
}: {
  label: string;
  icon?: typeof User;
  value: string;
  name?: string;
  placeholder?: string;
  type?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        )}
        <input
          type={type}
          name={name}
          defaultValue={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300 ${
            Icon ? 'pl-9' : 'pl-3'
          }`}
        />
      </div>
    </div>
  );
}
