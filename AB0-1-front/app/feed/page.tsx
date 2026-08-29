import { Metadata } from 'next';
import { FeedShell } from '@/components/feed/FeedShell';
import { getFeed } from '@/lib/api/feed';

export const metadata: Metadata = {
  title: 'Feed da Comunidade • Avalia Solar',
  description: 'Acompanhe análises, avaliações e novidades do mercado de energia solar e mobilidade elétrica.',
  robots: {
    index: false,
    follow: true,
  },
};

export default async function FeedPage({ searchParams }: { searchParams: { view?: string; type?: string } }) {
  const view = searchParams.view || 'for_you';
  const initialFeed = await getFeed({ view, type: searchParams.type, limit: 15 }).catch(() => null);
  return <FeedShell initialFeed={initialFeed} initialView={view} initialType={searchParams.type} />;
}
