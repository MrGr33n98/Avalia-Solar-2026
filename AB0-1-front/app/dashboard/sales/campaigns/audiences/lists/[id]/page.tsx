'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import WorkspaceFrame from '@/components/sales/campaigns/WorkspaceFrame';
import { AudienceNavigation } from '@/components/sales/campaigns/audiences/AudienceNavigation';
import { ArrowLeft, Users, Upload, Send, Trash2, Edit3, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { fetchContactList, removeContactsFromList, ContactList } from '@/lib/api-campaigns';

interface ContactRow {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  job_title?: string | null;
  account_name?: string | null;
}

export default function ContactListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listId = Number(params.id);

  const [list, setList] = useState<ContactList | null>(null);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!listId) return;
    setLoading(true);
    try {
      const res = await fetchContactList(listId, page);
      setList(res.contact_list);
      setContacts((res.contacts as ContactRow[]) || []);
      setTotalPages(res.meta?.total_pages || 1);
      setTotalCount(res.meta?.total_count || 0);
    } catch (err) {
      console.error('Erro ao carregar detalhes da lista:', err);
    } finally {
      setLoading(false);
    }
  }, [listId, page]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const toggleSelectAll = () => {
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map((c) => c.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleRemoveSelected = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Deseja remover ${selectedIds.length} contato(s) desta lista?`)) return;

    setActionLoading(true);
    try {
      await removeContactsFromList(listId, selectedIds);
      setSelectedIds([]);
      loadDetail();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover contatos.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <WorkspaceFrame title="Audiências">
      <div className="space-y-6">
        <AudienceNavigation activeTab="lists" />

        {/* Back navigation */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/sales/campaigns/audiences/lists"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors inline-flex items-center gap-2 text-xs font-semibold text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Listas</span>
          </Link>
        </div>

        {/* List Header & Action Toolbar */}
        {list && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900">{list.name}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-700">
                    {list.kind === 'static' ? 'Lista Estática' : 'Lista Importada'}
                  </span>
                </div>
                {list.description && <p className="text-sm text-slate-500 mt-1">{list.description}</p>}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/dashboard/sales/campaigns/audiences/import?list_id=${list.id}`}
                  className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4 text-sky-600" />
                  <span>Importar CSV para esta lista</span>
                </Link>

                <button
                  onClick={() => router.push(`/dashboard/sales/campaigns?create=true&list_id=${list.id}`)}
                  className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-2 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>Usar em Campanha</span>
                </button>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Total de Contatos</span>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-2">{totalCount.toLocaleString('pt-BR')}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Elegíveis Estimados</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-2">{totalCount.toLocaleString('pt-BR')}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Criada em</span>
                  <span className="text-[10px] text-slate-400">Data de registro</span>
                </div>
                <p className="text-sm font-bold text-slate-800 mt-3">
                  {new Date(list.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contacts Table Section */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900">
              Contatos da Lista ({totalCount})
            </h3>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600">{selectedIds.length} selecionado(s)</span>
                <button
                  onClick={handleRemoveSelected}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover da Lista</span>
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
              <span className="text-xs">Carregando contatos da lista...</span>
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-700">Esta lista ainda não possui contatos</h4>
              <p className="text-xs text-slate-500">Importe uma planilha CSV para popular esta lista.</p>
              <Link
                href={`/dashboard/sales/campaigns/audiences/import?list_id=${listId}`}
                className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Importar CSV</span>
              </Link>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === contacts.length && contacts.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                  </th>
                  <th className="py-3.5 px-4">Nome</th>
                  <th className="py-3.5 px-4">E-mail</th>
                  <th className="py-3.5 px-4">Empresa / Conta</th>
                  <th className="py-3.5 px-4">Cargo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(contact.id)}
                        onChange={() => toggleSelect(contact.id)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Sem Nome'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px]">{contact.email}</td>
                    <td className="py-3.5 px-4 text-slate-600">{contact.account_name || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{contact.job_title || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-xs text-slate-500">
                Página {page} de {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      </div>
    </WorkspaceFrame>
  );
}
