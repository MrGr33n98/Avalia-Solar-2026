'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Users, Trash2, Edit3, RefreshCw, ListFilter } from 'lucide-react';
import { fetchContactLists, createContactList, deleteContactList, ContactList } from '@/lib/api-campaigns';

export default function ContactListsPage() {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadLists = async () => {
    setLoading(true);
    try {
      const res = await fetchContactLists();
      setLists(res.contact_lists || []);
    } catch {
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLists();
  }, []);

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

  const handleDeleteList = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta lista?')) return;

    try {
      await deleteContactList(id);
      loadLists();
    } catch (err: any) {
      alert(err.message || 'Falha ao excluir lista.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/sales/campaigns/audiences"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Listas de Contatos</h1>
            <p className="text-sm text-slate-500">
              Gerencie listas estáticas de contatos para uso no construtor de público das campanhas.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Lista</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <span>Carregando listas de contatos...</span>
          </div>
        ) : lists.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ListFilter className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Nenhuma lista de contatos encontrada</h3>
            <p className="text-xs text-slate-500">Crie sua primeira lista para organizar seus contatos de marketing.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Nova Lista</span>
            </button>
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
              {lists.map((list) => (
                <tr key={list.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{list.name}</div>
                    {list.description && <div className="text-[11px] text-slate-400">{list.description}</div>}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {list.kind === 'static' ? 'Estática' : 'Importada'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {list.contacts_count} contatos
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(list.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleDeleteList(list.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
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
                  className="px-5 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 disabled:opacity-50 inline-flex items-center gap-2"
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
  );
}
