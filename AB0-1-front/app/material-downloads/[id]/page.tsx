'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Download, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type Status = 'preparing' | 'success' | 'expired' | 'invalid' | 'unavailable';

export default function MaterialDownloadPage({ params }: { params: { id: string } }) {
  const [status, setStatus] = useState<Status>('preparing');

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token');
    window.history.replaceState(null, '', window.location.pathname);
    if (!token) { setStatus('invalid'); return; }

    fetch(`/api/v1/material_downloads/${encodeURIComponent(params.id)}/file`, {
      headers: { 'X-Material-Download-Token': token },
    })
      .then(async (response) => {
        if (response.status === 403) { setStatus('expired'); return; }
        if (!response.ok) { setStatus('unavailable'); return; }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = 'material.pdf'; link.click();
        URL.revokeObjectURL(url); setStatus('success');
      })
      .catch(() => setStatus('unavailable'));
  }, [params.id]);

  const messages: Record<Status, { title: string; description: string }> = {
    preparing: { title: 'Preparando download', description: 'Validando sua autorização...' },
    success: { title: 'Download iniciado', description: 'Seu material foi baixado com segurança.' },
    expired: { title: 'Link expirado', description: 'Solicite um novo envio para receber o material.' },
    invalid: { title: 'Link inválido', description: 'O link não possui uma autorização válida.' },
    unavailable: { title: 'Material indisponível', description: 'Tente novamente em alguns instantes.' },
  };
  const current = messages[status];
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><Card className="w-full max-w-md rounded-2xl border bg-white shadow-xl"><CardContent className="p-8 text-center"><div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-blue-100 text-blue-700">{status === 'preparing' ? <Loader2 className="h-7 w-7 animate-spin" /> : status === 'success' ? <CheckCircle2 className="h-7 w-7" /> : <Download className="h-7 w-7" />}</div><h1 className="text-xl font-bold text-slate-950">{current.title}</h1><p className="mt-2 text-sm text-slate-600">{current.description}</p></CardContent></Card></main>;
}
