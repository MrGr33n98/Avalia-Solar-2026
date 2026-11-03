import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Pré-visualização Editorial | Avalia Solar',
  description: 'Ambiente de pré-visualização isolado do Article Studio.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      noimageindex: true,
    },
  },
};

export default function ArticlePreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
