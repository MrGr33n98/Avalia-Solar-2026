import Link from 'next/link';

export default function NotFound() {
  return <main className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-2xl font-bold text-slate-900">Creator não encontrado.</h1><p className="mt-2 text-slate-600">Perfil privado ou URL inválida.</p><Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-amber-400 px-5 py-3 font-semibold">Voltar para início</Link></main>;
}
