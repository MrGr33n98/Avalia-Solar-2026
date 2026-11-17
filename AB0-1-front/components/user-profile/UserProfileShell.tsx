'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { UserTabId, UserProfileData, EquipmentItem, ProfileSavePayload } from './types';
import { UserProfileTrustCard } from './UserProfileTrustCard';
import { UserProfileSidebarNav } from './UserProfileSidebarNav';
import { ProfileDetailsTab } from './tabs/ProfileDetailsTab';
import { ProductsIUseTab } from './tabs/ProductsIUseTab';
import { PrivacySettingsTab } from './tabs/PrivacySettingsTab';
import { MyReviewsTab } from './tabs/MyReviewsTab';

export const USER_PROFILE_TABS: UserTabId[] = [
  'activity_center',
  'my_reviews',
  'products_used',
  'my_rewards',
  'my_lists',
  'community_qa',
  'achievements',
  'notifications',
  'profile_details',
  'privacy_settings',
];

export function isValidTab(tab: string | null | undefined): tab is UserTabId {
  return !!tab && (USER_PROFILE_TABS as string[]).includes(tab);
}

const PLACEHOLDER_TABS: UserTabId[] = [
  'activity_center',
  'my_rewards',
  'my_lists',
  'community_qa',
  'achievements',
  'notifications',
];

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
 * Layout da central de perfil. Usa `useSearchParams()` e, por isso,
 * DEVE ser renderizado dentro de um <Suspense> (exigência do Next.js 14).
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

  // Mantém a aba sincronizada com voltar/avançar do navegador.
  useEffect(() => {
    if (isValidTab(rawTab)) setActiveTab(rawTab);
  }, [rawTab]);

  const handleSelectTab = (tab: UserTabId) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    url.hash = 'main';
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className={`min-h-screen bg-slate-50/50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Coluna Esquerda: Trust Anchor & Navegação */}
          <aside className="lg:col-span-1 space-y-4 lg:sticky lg:top-8 min-w-0">
            <UserProfileTrustCard trustAnchor={data.trust_anchor} onUploadAvatar={onUploadAvatar} />

            <UserProfileSidebarNav activeTab={activeTab} onSelectTab={handleSelectTab} stats={data.stats} />
          </aside>

          {/* Coluna Direita: Canvas de Conteúdo da Aba Ativa */}
          <main
            id="main"
            className="lg:col-span-3 min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs"
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

            {activeTab === 'my_reviews' && <MyReviewsTab stats={data.stats} onWriteReview={onWriteReview} />}

            {activeTab === 'privacy_settings' && <PrivacySettingsTab settings={data.privacy_settings} />}

            {PLACEHOLDER_TABS.includes(activeTab) && (
              <div className="text-center py-16" data-testid="tab-placeholder">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Seção em Expansão</h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  A seção selecionada ainda não está disponível nesta central.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
