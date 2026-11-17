'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfileShell } from '@/components/user-profile/UserProfileShell';
import type {
  EquipmentItem,
  ProfileSavePayload,
  UserProfileData,
} from '@/components/user-profile/types';
import {
  buildUserProfileData,
  joinFullName,
  normalizeSolutions,
  type ReviewerProfilePayload,
  type ReviewSummaryPayload,
} from '@/components/user-profile/mappers';
import { AddUserSolutionModal } from '@/components/profile/AddUserSolutionModal';
import {
  reviewDashboardApi,
  reviewerProfileApi,
  reviewerSolutionsApi,
  usersApi,
} from '@/lib/api';

const PROFILE_PATH = '/user/profile';
/** Os endpoints /reviewer/* exigem papel `review` ou `admin` (Api::V1::Reviewer::BaseController). */
const REVIEWER_ROLES = ['review', 'admin'];

type LoadState = 'loading' | 'ready' | 'error' | 'forbidden';

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

export function UserProfileLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8"
      data-testid="user-profile-loading"
    >
      <span className="sr-only">Carregando perfil...</span>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="h-80 rounded-2xl bg-white border border-slate-200/80 animate-pulse" />
          <div className="h-64 rounded-2xl bg-white border border-slate-200/80 animate-pulse" />
        </div>
        <div className="lg:col-span-3 h-[560px] rounded-2xl bg-white border border-slate-200/80 animate-pulse" />
      </div>
    </div>
  );
}

function StatusPanel({
  title,
  description,
  action,
  testId,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  testId: string;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16" data-testid={testId}>
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}

export function UserProfileContent() {
  const { user, loading: authLoading, isAuthenticated, checkAuth } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<LoadState>('loading');
  const [data, setData] = useState<UserProfileData | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const userRef = useRef(user);
  userRef.current = user;
  const userId = user?.id;
  const userRole = user?.role;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(PROFILE_PATH)}`);
    }
  }, [authLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    const authUser = userRef.current;
    if (!authUser) return;
    if (!REVIEWER_ROLES.includes(authUser.role)) {
      setState('forbidden');
      return;
    }

    setState('loading');
    const [profileResult, solutionsResult, summaryResult] = await Promise.allSettled([
      reviewerProfileApi.get(),
      reviewerSolutionsApi.list(),
      reviewDashboardApi.getSummary(),
    ]);

    if (profileResult.status === 'rejected') {
      setState('error');
      return;
    }

    setData(
      buildUserProfileData({
        authUser,
        profilePayload: (profileResult.value ?? {}) as ReviewerProfilePayload,
        solutions: solutionsResult.status === 'fulfilled' ? solutionsResult.value : undefined,
        solutionsFailed: solutionsResult.status === 'rejected',
        summary:
          summaryResult.status === 'fulfilled'
            ? ((summaryResult.value ?? null) as ReviewSummaryPayload | null)
            : null,
      })
    );
    setState('ready');
  }, []);

  useEffect(() => {
    if (userId != null) void load();
  }, [userId, userRole, load]);

  const reloadEquipments = useCallback(async () => {
    try {
      const response = await reviewerSolutionsApi.list();
      const equipments = normalizeSolutions(response);
      setData((prev) =>
        prev ? { ...prev, equipments, stats: { ...prev.stats, equipments_count: equipments.length } } : prev
      );
    } catch {
      toast.error('Não foi possível carregar seus equipamentos.');
    }
  }, []);

  const handleSaveProfile = useCallback(
    async ({ personal, professional }: ProfileSavePayload) => {
      const current = data;
      const authUser = userRef.current;
      if (!current || !authUser) throw new Error('Sessão indisponível. Recarregue a página.');

      const fullName = joinFullName(personal.first_name, personal.last_name);
      const nameChanged = fullName !== current.trust_anchor.full_name;

      // 1) Nome: users.name via PUT /users/:id (autorizado apenas para o próprio usuário).
      if (nameChanged) {
        try {
          await usersApi.update(Number(authUser.id), { name: fullName });
        } catch (error) {
          toast.error('Não foi possível atualizar o nome.');
          throw new Error(errorMessage(error, 'Não foi possível atualizar o nome.'));
        }
        setData((prev) =>
          prev
            ? {
                ...prev,
                trust_anchor: { ...prev.trust_anchor, full_name: fullName },
                personal_details: {
                  ...prev.personal_details,
                  first_name: personal.first_name.trim(),
                  last_name: personal.last_name.trim(),
                },
              }
            : prev
        );
        void checkAuth({ force: true });
      }

      // 2) Perfil de avaliador: somente campos aceitos por ProfileController#profile_params.
      let response: ReviewerProfilePayload;
      try {
        response = (await reviewerProfileApi.update({
          profession: personal.headline.trim(),
          bio: personal.summary.trim(),
          company_name: professional.company_name.trim(),
        })) as ReviewerProfilePayload;
      } catch (error) {
        const message = nameChanged
          ? 'Nome atualizado, mas não foi possível salvar os demais dados.'
          : 'Não foi possível salvar as alterações.';
        toast.error(message);
        throw new Error(errorMessage(error, message));
      }

      const saved = response?.profile ?? {};
      const profession = typeof saved.profession === 'string' ? saved.profession : '';
      const bio = typeof saved.bio === 'string' ? saved.bio : '';
      const company = typeof saved.company_name === 'string' ? saved.company_name : '';

      setData((prev) =>
        prev
          ? {
              ...prev,
              trust_anchor: { ...prev.trust_anchor, role: profession, company },
              personal_details: { ...prev.personal_details, headline: profession, summary: bio },
              professional_details: { company_name: company },
            }
          : prev
      );
      toast.success('Perfil atualizado com sucesso!');
    },
    [data, checkAuth]
  );

  const handleUploadAvatar = useCallback(
    async (file: File) => {
      try {
        const response = (await reviewerProfileApi.uploadAvatar(file)) as ReviewerProfilePayload;
        const avatarUrl = response?.user?.avatar_url ?? null;
        setData((prev) =>
          prev ? { ...prev, trust_anchor: { ...prev.trust_anchor, avatar_url: avatarUrl } } : prev
        );
        void checkAuth({ force: true });
        toast.success('Foto atualizada.');
      } catch (error) {
        toast.error('Não foi possível enviar a foto.');
        throw new Error(errorMessage(error, 'Não foi possível enviar a foto.'));
      }
    },
    [checkAuth]
  );

  const handleAddEquipment = useCallback(
    async (solution: { name: string; type: string; category: string; companyId?: string }) => {
      try {
        const created = await reviewerSolutionsApi.create({
          name: solution.name,
          solution_type: solution.type,
          category: solution.category,
          company_id: solution.companyId,
        });
        const [item] = normalizeSolutions([created]);
        if (item) {
          setData((prev) => {
            if (!prev) return prev;
            const current = prev.equipments ?? [];
            const equipments = current.some((eq) => eq.id === item.id) ? current : [item, ...current];
            return { ...prev, equipments, stats: { ...prev.stats, equipments_count: equipments.length } };
          });
        } else {
          await reloadEquipments();
        }
        toast.success('Equipamento adicionado.');
      } catch (error) {
        toast.error(errorMessage(error, 'Não foi possível adicionar o equipamento.'));
        throw error;
      }
    },
    [reloadEquipments]
  );

  const handleRemoveEquipment = useCallback(async (id: string) => {
    await reviewerSolutionsApi.remove(id);
    setData((prev) => {
      if (!prev || !prev.equipments) return prev;
      const equipments = prev.equipments.filter((eq) => eq.id !== id);
      return { ...prev, equipments, stats: { ...prev.stats, equipments_count: equipments.length } };
    });
    toast.success('Equipamento removido.');
  }, []);

  const handleLeaveReview = useCallback(
    (equipment?: EquipmentItem) => {
      if (equipment?.type === 'company' && equipment.companyId) {
        router.push(`/companies/${encodeURIComponent(equipment.companyId)}/review`);
        return;
      }
      router.push('/companies');
    },
    [router]
  );

  if (authLoading || !isAuthenticated) return <UserProfileLoading />;

  if (state === 'forbidden') {
    return (
      <StatusPanel
        testId="user-profile-forbidden"
        title="Central disponível para contas de avaliador"
        description="Sua conta não possui um perfil de avaliador. Acesse o painel correspondente ao seu tipo de conta."
        action={
          <Link href="/dashboard" className="text-sm font-semibold text-blue-600 hover:underline">
            Ir para o painel
          </Link>
        }
      />
    );
  }

  if (state === 'error') {
    return (
      <StatusPanel
        testId="user-profile-error"
        title="Não foi possível carregar seu perfil"
        description="Verifique sua conexão e tente novamente."
        action={
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white"
          >
            Tentar novamente
          </button>
        }
      />
    );
  }

  if (state === 'loading' || !data) return <UserProfileLoading />;

  return (
    <>
      <UserProfileShell
        data={data}
        onSaveProfile={handleSaveProfile}
        onUploadAvatar={handleUploadAvatar}
        onAddEquipment={() => setAddOpen(true)}
        onRemoveEquipment={handleRemoveEquipment}
        onRetryEquipments={() => void reloadEquipments()}
        onLeaveReview={handleLeaveReview}
        onWriteReview={() => router.push('/companies')}
      />
      <AddUserSolutionModal open={addOpen} onOpenChange={setAddOpen} onAdd={handleAddEquipment} />
    </>
  );
}
