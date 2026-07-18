import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Solicitar orçamento | Avalia Solar',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CompanyQuoteLayout({ children }: { children: ReactNode }) {
  return children;
}
