'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import WorkspaceFrame from '@/components/sales/campaigns/WorkspaceFrame';
import { AudienceNavigation } from '@/components/sales/campaigns/audiences/AudienceNavigation';
import { Plus, Users, Trash2, RefreshCw, ListFilter, Upload, Search, ChevronRight } from 'lucide-react';
import { fetchContactLists, createContactList, deleteContactList, ContactList } from '@/lib/api-campaigns';

export default function ContactListsPage() {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const activeParam = filterActive === 'all' ? undefined : filterActive === 'true';
      const res = await fetchContactLists({ active: activeParam });
      setLists(res.contact_lists || []);
    } catch {
      setLists([]);
    } finally {
      setLoading(false);
    }
  }, [filterActive]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await createContactList({ name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
      setIsModalOpen(false);
      loadLists();
    } catch (err: any) {
      alert(err.message || 'Falha ao criar lista.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteList = async (id: number, listName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm(`Tem certeza que deseja excluir a lista "${listName}"?`)) return;

    try {
      await deleteContactList(id);
      loadLists();
    } catch (err: any) {
      alert(err.message || 'Falha ao excluir lista.');
    }
  };

  const filteredLists = lists.filter((list) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return list.name.toLowerCase().includes(q) || (list.description && list.description.toLowerCase().includes(q));
  });

  return (
    <WorkspaceFrame title="Audiências">
      <div className="space-y-6">
        <AudienceNavigation activeTab="lists" />

        {/* Header section */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Listas de Contatos Estáticas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Organize contatos selecionados em listas permanentes para campanhas de e-mail e automações.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/sales/campaigns/audiences/import"
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Importar CSV</span>
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition-colors inline-flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Lista</span>
            </button>
          </div>
        </div>

        {/* Search and Filters toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-2xl shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome da lista..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <label className="text-xs text-slate-500 font-medium">Status:</label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Todas as listas</option>
              <option value="true">Ativas</option>
              <option value="false">Arquivadas</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
              <span className="text-xs">Carregando listas de contatos...</span>
            </div>
          ) : filteredLists.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ListFilter className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">Nenhuma lista de contatos encontrada</h3>
              <p className="text-xs text-slate-500">Crie sua primeira lista ou importe um CSV para organizar contatos.</p>

              <div className="flex justify-center gap-3 pt-2">
                <Link
                  href="/dashboard/sales/campaigns/audiences/import"
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Importar CSV</span>
                </Link>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Nova Lista</span>
                </button>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Nome da Lista</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4">Contatos</th>
                  <th className="py-3.5 px-4">Criado em</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLists.map((list) => (
                  <tr
                    key={list.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => (window.location.href = `/dashboard/sales/campaigns/audiences/lists/${list.id}`)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                          {list.name}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-500 transition-colors" />
                      </div>
                      {list.description && <div className="text-[11px] text-slate-400 mt-0.5">{list.description}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {list.kind === 'static' ? 'Estática' : 'Importada'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {list.contacts_count} contatos
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(list.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        href={`/dashboard/sales/campaigns/audiences/import?list_id=${list.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                        title="Importar CSV para esta lista"
                      >
                        + CSV
                      </Link>

                      <button
                        onClick={(e) => handleDeleteList(list.id, list.name, e)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                        title="Excluir lista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Nova Lista */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Nova Lista de Contatos</h3>
              <form onSubmit={handleCreateList} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Lista</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Clientes VIP Sul 2026"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição (opcional)</label>
                  <textarea
                    rows={3}
                    placeholder="Finalidade desta lista..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 disabled:opacity-50 inline-flex items-center gap-2 shadow-xs"
                  >
                    {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Criar Lista</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </WorkspaceFrame>
  );
}
