import { redirect } from 'next/navigation';

interface Props {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function DashboardPropostasRedirectPage({ searchParams }: Props) {
  const params = new URLSearchParams();
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (typeof v === 'string') {
        params.set(k, v);
      } else if (Array.isArray(v)) {
        v.forEach((val) => params.append(k, val));
      }
    });
  }
  const query = params.toString();
  redirect(`/dashboard/proposals${query ? `?${query}` : ''}`);
}
