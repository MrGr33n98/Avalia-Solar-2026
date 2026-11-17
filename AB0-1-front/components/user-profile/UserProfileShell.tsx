'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { UserTabId, UserProfileData, EquipmentItem, ProfileSavePayload } from './types';
import { validateAvatarFile } from './UserProfileTrustCard';
import { ProfileDetailsTab } from './tabs/ProfileDetailsTab';
import { ProductsIUseTab } from './tabs/ProductsIUseTab';
import { PrivacySettingsTab } from './tabs/PrivacySettingsTab';
import { MyReviewsTab } from './tabs/MyReviewsTab';

/** Profile sections within the canonical review dashboard; future tabs stay gated. */
export const USER_PROFILE_TABS: UserTabId[] = [
  'profile_details', 'my_reviews', 'products_used', 'privacy_settings',
];

const PROFILE_TAB_LINKS: Array<{ id: UserTabId; label: string }> = [
  { id: 'profile_details', label: 'Dados do perfil' },
  { id: 'my_reviews', label: 'Avaliações' },
  { id: 'products_used', label: 'Produtos que uso' },
  { id: 'privacy_settings', label: 'Privacidade' },
];

export function isValidTab(tab: string | null | undefined): tab is UserTabId {
  return !!tab && USER_PROFILE_TABS.includes(tab as UserTabId);
}

interface UserProfileShellProps {
  data: UserProfileData;
  onSaveProfile: (payload: ProfileSavePayload) => Promise<void>;
  onUploadAvatar?: (file: File) => Promise<void>;
  onAddEquipment?: () => void;
  onRemoveEquipment?: (id: string) => Promise<void>;
  onRetryEquipments?: () => void;
  onLeaveReview?: (equipment?: EquipmentItem) => void;
  onWriteReview?: () => void;
  className?: string;
}

/**
 * Content-only profile. ReviewerDashboardShell owns the ONLY main sidebar.
 * The caller must wrap this component in Suspense (Next.js 14 useSearchParams).
 */
export function UserProfileShell({
  data,
  onSaveProfile,
  onUploadAvatar,
  onAddEquipment,
  onRemoveEquipment,
  onRetryEquipments,
  onLeaveReview,
  onWriteReview,
  className = '',
}: UserProfileShellProps) {
  const searchParams = useSearchParams();
  const rawTab = searchParams?.get('tab') ?? null;
  const [activeTab, setActiveTab] = useState<UserTabId>(isValidTab(rawTab) ? rawTab : 'profile_details');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveTab(isValidTab(rawTab) ? rawTab : 'profile_details');
  }, [rawTab]);

  const handleSelectTab = (tab: UserTabId) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    url.hash = 'profile-content';
    window.history.pushState({}, '', url.toString());
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file || !onUploadAvatar) return;
    setAvatarError(null);
    const error = validateAvatarFile(file);
    if (error) {
      setAvatarError(error);
      event.currentTarget.value = '';
      return;
    }
    setAvatarUploading(true);
    try {
      await onUploadAvatar(file);
    } catch {
      setAvatarError('Não foi possível atualizar a foto. Tente novamente.');
    } finally {
      setAvatarUploading(false);
      if (avatarInput.current) avatarInput.current.value = '';
    }
  };

  return (
    <section className={`min-w-0 w-full space-y-4 ${className}`} data-testid="reviewer-profile-integrated">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Meu perfil</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gerencie seus dados e acompanhe suas contribuições na Avalia Solar.
          </p>
        </div>
        {onUploadAvatar && (
          <>
            <input
              ref={avatarInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Selecionar nova foto de perfil"
              className="sr-only"
              onChange={(event) => { void handleAvatarChange(event); }}
              data-testid="reviewer-profile-avatar-input"
            />
            <button
              type="button"
              onClick={() => avatarInput.current?.click()}
              disabled={avatarUploading}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:border-blue-400 hover:text-blue-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {avatarUploading ? 'Enviando foto...' : 'Alterar foto'}
            </button>
          </>
        )}
      </header>

      {avatarError && <p role="alert" className="text-sm text-red-700">{avatarError}</p>}

      <nav
        aria-label="Seções do perfil"
        className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
      >
        {PROFILE_TAB_LINKS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleSelectTab(id)}
            aria-current={activeTab === id ? 'page' : undefined}
            className={`min-h-11 shrink-0 rounded-lg px-3 text-xs font-semibold transition-colors sm:text-sm ${activeTab === id
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
            data-testid={`profile-tab-${id}`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div
        id="profile-content"
        className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
      >
        {activeTab === 'profile_details' && (
          <ProfileDetailsTab
            initialPersonal={data.personal_details}
            initialProfessional={data.professional_details}
            onSave={onSaveProfile}
          />
        )}

        {activeTab === 'products_used' && (
          <ProductsIUseTab
            equipments={data.equipments}
            onAddEquipment={onAddEquipment}
            onRemoveEquipment={onRemoveEquipment}
            onRetry={onRetryEquipments}
            onLeaveReview={onLeaveReview}
          />
        )}

        {activeTab === 'my_reviews' && (
          <MyReviewsTab stats={data.stats} onWriteReview={onWriteReview} />
        )}

        {activeTab === 'privacy_settings' && (
          <PrivacySettingsTab settings={data.privacy_settings} />
        )}
      </div>
    </section>
  );
}
