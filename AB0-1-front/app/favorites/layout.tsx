import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Favoritos | Avalia Solar',
  robots: {
    index: false,
    follow: false,
  },
};

export default function FavoritesLayout({ children }: { children: ReactNode }) {
  return children;
}
