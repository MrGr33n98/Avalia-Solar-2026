'use client';

import { usePageTracking } from '@/hooks/usePageTracking';

export default function ContactPage() {
  // GTM Page Tracking
  usePageTracking({
    type: 'other',
    title: 'Contato - Avalia Solar',
  });

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">Contato</h1>
        <p className="text-lg text-muted-foreground">
          Pagina em construcao. Em breve voce podera falar com nossa equipe por aqui.
        </p>
        <div className="mt-8 space-y-2 text-sm text-muted-foreground">
          <p>Email: contato@avaliasolar.com.br</p>
          <p>Telefone: (65) 99242-3309</p>
        </div>
      </div>
    </div>
  );
}

