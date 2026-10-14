import type { Metadata } from 'next';
import TeamManagementWorkspace from '@/components/dashboard/team/TeamManagementWorkspace';

export const metadata: Metadata = {
  title: 'Gestão de Equipe & Permissões | Avalia Solar B2B',
  description: 'Gerencie membros, papéis corporativos e convites transacionais da sua empresa no Avalia Solar.',
};

export default function TeamSettingsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <TeamManagementWorkspace />
    </div>
  );
}
