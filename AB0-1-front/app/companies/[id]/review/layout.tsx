import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Avaliar empresa | Avalia Solar',
  robots: {
    index: false,
    follow: true,
  },
};

export default function CompanyReviewLayout({ children }: { children: ReactNode }) {
  return children;
}
