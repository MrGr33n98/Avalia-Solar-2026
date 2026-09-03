'use client';

import Link from 'next/link';
import { Building2, MapPin, UserCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PersonListItem } from '../PeopleTable';

interface PeopleMapViewProps {
  contacts: PersonListItem[];
}

export default function PeopleMapView({ contacts }: PeopleMapViewProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-700" />
          <h2 className="text-sm font-bold text-slate-900">Visão Geográfica de Pessoas (People Map)</h2>
        </div>
        <span className="text-xs text-slate-500 font-medium">{contacts.length} contatos mapeados</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
        {contacts.map((c) => (
          <div key={c.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2 hover:border-indigo-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-900 text-white font-bold text-xs flex items-center justify-center">
                  {c.first_name[0]}
                </div>
                <div>
                  <Link href={`/dashboard/sales/people/${c.id}`} className="font-bold text-xs text-slate-900 hover:text-indigo-600 block">
                    {c.name}
                  </Link>
                  {c.job_title && <span className="text-[11px] text-slate-500 block">{c.job_title}</span>}
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] bg-white border-indigo-200 text-indigo-900">
                {c.decision_role || 'Decisor'}
              </Badge>
            </div>

            {c.account_name && (
              <p className="text-xs text-slate-700 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                <span className="font-semibold">{c.account_name}</span>
              </p>
            )}

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">
                {c.last_contact_at ? `Último contato: ${new Date(c.last_contact_at).toLocaleDateString('pt-BR')}` : 'Sem contato'}
              </span>
              <Link href={`/dashboard/sales/people/${c.id}`} className="font-bold text-indigo-700 hover:underline">
                Ver Perfil →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
