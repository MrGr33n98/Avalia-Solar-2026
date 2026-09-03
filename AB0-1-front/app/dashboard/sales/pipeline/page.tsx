import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/dashboard/sales/leads?view=kanban');
}
