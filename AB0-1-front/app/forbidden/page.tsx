import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Building2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Acesso Não Autorizado | Avalia Solar',
  description: 'Sua conta não possui permissão para acessar esta superfície de produto.',
};

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/80 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <div className="p-4 rounded-2xl bg-red-950/80 text-red-400 border border-red-800/60 w-16 h-16 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Acesso Restrito</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sua conta não possui permissão para acessar o <strong>Avalia Solar CRM Interno</strong>.
            Esta superfície é reservada para a equipe comercial e operações do Avalia Solar.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <Button
            asChild
            className="h-11 px-5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <a href="https://app.avaliasolar.com.br/dashboard">
              <Building2 className="w-4 h-4" /> Ir para o Portal da Empresa (App)
            </a>
          </Button>

          <Button
            variant="outline"
            asChild
            className="h-11 px-5 text-xs font-bold border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl"
          >
            <a href="https://www.avaliasolar.com.br">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Ir para o Marketplace Público
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
