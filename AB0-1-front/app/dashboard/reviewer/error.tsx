'use client';
import { ReviewerShell } from '@/components/reviewer/ReviewerShell';
export default function Error({ reset }: { reset: () => void }) { return <ReviewerShell><div role="alert" className="rounded-2xl bg-red-50 p-6 text-red-800"><h1 className="font-bold">Erro no Reviewer Dashboard</h1><button type="button" onClick={reset} className="mt-4 min-h-11 rounded-lg bg-blue-600 px-4 font-bold text-white">Tentar novamente</button></div></ReviewerShell>; }
