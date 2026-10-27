import SnapshotsPage from '@/components/sales/reports/snapshots/SnapshotsPage';

export const metadata = {
  title: 'Snapshots de Pipeline & Win Rate | CRM Interno Avalia Solar',
  description: 'Histórico de tamanho do pipeline aberto e taxa de conversão dos negócios encerrados.',
};

export default function SalesSnapshotsRoute() {
  return <SnapshotsPage />;
}
