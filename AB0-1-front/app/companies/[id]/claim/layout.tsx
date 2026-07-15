import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Reivindicar perfil | Avalia Solar',
  robots: {
    index: false,
    follow: true,
  },
};

export default function CompanyClaimLayout({ children }: { children: ReactNode }) {
  return children;
}
