import { Metadata } from 'next';
import { FeedShell } from '@/components/feed/FeedShell';

export const metadata: Metadata = {
  title: 'Feed da Comunidade • Avalia Solar',
  description: 'Acompanhe análises, avaliações e novidades do mercado de energia solar e mobilidade elétrica.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function FeedPage() {
  return <FeedShell />;
}
