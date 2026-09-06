'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import WorkspaceFrame from '@/components/sales/campaigns/WorkspaceFrame';
import { AudienceNavigation } from '@/components/sales/campaigns/audiences/AudienceNavigation';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, Layers, ListFilter, ArrowRight } from 'lucide-react';
import {
  uploadContactImport,
  updateImportMapping,
  commitImport,
  fetchContactImport,
  fetchContactLists,
  ContactImport,
  ContactList,
} from '@/lib/api-campaigns';

function ImportContactsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawListId = searchParams.get('list_id');
  const preselectedListId = rawListId && Number.isFinite(Number(rawListId)) ? Number(rawListId) : null;

  const [step, setStep] = useState<'upload' | 'mapping' | 'options' | 'preview' | 'processing' | 'done'>('upload');
  const [fileContent, setFileContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [estimatedRows, setEstimatedRows] = useState<number>(0);
  const [importObj, setImportObj] = useState<ContactImport | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [sampleRows, setSampleRows] = useState<Record<string, string>[]>([]);
  const [dedupPolicy, setDedupPolicy] = useState<'skip' | 'update'>('update');
  const [destinationType, setDestinationType] = useState<'existing' | 'new' | 'none'>(preselectedListId ? 'existing' : 'new');
  const [targetListId, setTargetListId] = useState<number | null>(preselectedListId);
  const [targetListName, setTargetListName] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load existing lists for destination selection
  useEffect(() => {
    fetchContactLists({ active: true })
      .then((res) => setContactLists(res.contact_lists || []))
      .catch(() => setContactLists([]));
  }, []);

  // Update target list name if preselectedListId matches
  useEffect(() => {
    if (preselectedListId && contactLists.length > 0) {
      const found = contactLists.find((l) => l.id === preselectedListId);
      if (found) {
        setTargetListId(found.id);
        setTargetListName(found.name);
      }
    }
  }, [preselectedListId, contactLists]);

  const parseCsvSamples = (content: string) => {
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    setEstimatedRows(Math.max(0, lines.length - 1));
    if (lines.length <= 1) return;

    const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());
    const samples: Record<string, string>[] = [];

    for (let i = 1; i < Math.min(6, lines.length); i++) {
      const cols = lines[i].split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx] || '';
      });
      samples.push(rowObj);
    }
    setSampleRows(samples);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMsg('Apenas arquivos no formato CSV (.csv) são permitidos.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('O arquivo excede o limite máximo permitido de 10 MB.');
      return;
    }

    setFilename(file.name);
    setFileSize(file.size);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      parseCsvSamples(content);
    };
    reader.readAsText(file);
  };

  const handleUploadSubmit = async () => {
    if (!fileContent) {
      setErrorMsg('Selecione um arquivo CSV válido para continuar.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await uploadContactImport(fileContent, filename || 'contatos.csv');
      setImportObj(res.contact_import);
      setMapping(res.suggested_mapping || {});
      setStep('mapping');
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao enviar arquivo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMapping = async () => {
    if (!importObj) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const tagsArray = tagInput ? tagInput.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const options = {
        dedup_policy: dedupPolicy,
        target_list_id: destinationType === 'existing' ? targetListId : null,
        target_list_name: destinationType === 'new' ? targetListName || filename.replace('.csv', '') : null,
        tags: tagsArray,
      };

      const res = await updateImportMapping(importObj.id, mapping, options);
      setImportObj(res.contact_import);
      setStep('preview');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar mapeamento de colunas.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!importObj) return;

    setLoading(true);
    setErrorMsg(null);
    setStep('processing');

    try {
      const res = await commitImport(importObj.id);
      setImportObj(res.contact_import);
      startPolling(importObj.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao iniciar processamento de importação.');
      setStep('preview');
      setLoading(false);
    }
  };

  // Poll status until completed/failed
  const startPolling = useCallback((id: number) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetchContactImport(id);
        setImportObj(res.contact_import);
        if (['completed', 'failed', 'cancelled'].includes(res.contact_import.status)) {
          clearInterval(interval);
          setLoading(false);
          setStep('done');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
  }, []);

  const crmFields = [
    { key: 'ignore', label: '-- Ignorar coluna --' },
    { key: 'first_name', label: 'Nome' },
    { key: 'last_name', label: 'Sobrenome' },
    { key: 'email', label: 'E-mail' },
    { key: 'phone', label: 'Telefone / WhatsApp' },
    { key: 'job_title', label: 'Cargo' },
    { key: 'company', label: 'Empresa / Conta' },
    { key: 'city', label: 'Cidade' },
    { key: 'state', label: 'Estado (UF)' },
  ];

  return (
    <WorkspaceFrame title="Audiências">
      <div className="space-y-6">
        <AudienceNavigation activeTab="import" />

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Importação de Contatos CSV</h2>
            <p className="mt-1 text-sm text-slate-500">
              Adicione contatos ao CRM via arquivo CSV com deduplicação, mapeamento de colunas e inclusão em listas.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Stepper Header */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold text-slate-500">
          <div className={`p-2.5 rounded-xl border transition-all ${step === 'upload' ? 'bg-sky-50 border-sky-300 text-sky-700 font-bold shadow-2xs' : 'bg-white border-slate-200'}`}>
            1. Selecionar CSV
          </div>
          <div className={`p-2.5 rounded-xl border transition-all ${step === 'mapping' ? 'bg-sky-50 border-sky-300 text-sky-700 font-bold shadow-2xs' : 'bg-white border-slate-200'}`}>
            2. Mapear Colunas
          </div>
          <div className={`p-2.5 rounded-xl border transition-all ${step === 'preview' ? 'bg-sky-50 border-sky-300 text-sky-700 font-bold shadow-2xs' : 'bg-white border-slate-200'}`}>
            3. Opções & Destino
          </div>
          <div className={`p-2.5 rounded-xl border transition-all ${step === 'done' || step === 'processing' ? 'bg-sky-50 border-sky-300 text-sky-700 font-bold shadow-2xs' : 'bg-white border-slate-200'}`}>
            4. Resultado
          </div>
        </div>

        {/* STEP 1: UPLOAD DROPZONE */}
        {step === 'upload' && (
          <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-xs text-center space-y-6">
            <div className="w-16 h-16 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-center mx-auto text-sky-600">
              <Upload className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Selecione seu arquivo CSV de contatos</h3>
              <p className="text-xs text-slate-500 mt-1">
                Formato suportado: <strong>CSV UTF-8 (.csv)</strong> · Tamanho máximo: <strong>10 MB</strong>.
              </p>
            </div>

            <div className="max-w-md mx-auto p-6 border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl bg-slate-50/50 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700 cursor-pointer"
              />
            </div>

            {filename && (
              <div className="inline-flex flex-col items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-4 py-2.5 rounded-xl">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                  <span>{filename}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-normal">
                  {(fileSize / 1024).toFixed(1)} KB · ~{estimatedRows.toLocaleString('pt-BR')} linhas estimadas
                </span>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleUploadSubmit}
                disabled={loading || !fileContent}
                className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-semibold text-sm hover:bg-sky-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2 shadow-xs"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Avançar para Mapeamento</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: MAPPING */}
        {step === 'mapping' && (
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Mapeamento de Colunas</h3>
              <p className="text-xs text-slate-500 mt-1">
                Associe as colunas encontradas no arquivo aos campos do CRM.
              </p>
            </div>

            <div className="space-y-3">
              {Object.keys(mapping).map((col) => {
                const sampleVal = sampleRows.length > 0 ? sampleRows[0][col] : '';
                return (
                  <div key={col} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                    <div className="w-1/3 min-w-0 pr-2">
                      <span className="font-semibold text-slate-800 block truncate">{col}</span>
                      {sampleVal && <span className="text-[11px] text-slate-400 block truncate font-mono">Ex: {sampleVal}</span>}
                    </div>
                    <span className="text-slate-400 text-xs px-2">→</span>
                    <select
                      value={mapping[col] || 'ignore'}
                      onChange={(e) => setMapping({ ...mapping, [col]: e.target.value })}
                      className="w-1/2 p-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      {crmFields.map((field) => (
                        <option key={field.key} value={field.key}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Options section */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Opções de Importação & Lista Destino</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deduplicação de Contatos</label>
                  <select
                    value={dedupPolicy}
                    onChange={(e) => setDedupPolicy(e.target.value as 'skip' | 'update')}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white"
                  >
                    <option value="update">Atualizar campos vazios no contato existente</option>
                    <option value="skip">Ignorar contato se o e-mail já existir no CRM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lista Destino</label>
                  <select
                    value={destinationType}
                    onChange={(e) => setDestinationType(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white mb-2"
                  >
                    <option value="new">Criar nova lista com nome do arquivo</option>
                    <option value="existing">Adicionar a uma lista existente</option>
                    <option value="none">Apenas salvar em Contatos (sem lista)</option>
                  </select>

                  {destinationType === 'existing' && (
                    <select
                      value={targetListId || ''}
                      onChange={(e) => setTargetListId(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white"
                    >
                      <option value="">-- Selecionar Lista Destino --</option>
                      {contactLists.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.contacts_count} contatos)
                        </option>
                      ))}
                    </select>
                  )}

                  {destinationType === 'new' && (
                    <input
                      type="text"
                      placeholder="Nome da nova lista"
                      value={targetListName}
                      onChange={(e) => setTargetListName(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tags para aplicar aos contatos (separadas por vírgula)</label>
                <input
                  type="text"
                  placeholder="ex: Lead2026, EventoSolar, ImportacaoMarço"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Voltar
              </button>
              <button
                onClick={handleSaveMapping}
                disabled={loading}
                className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-semibold text-sm hover:bg-sky-700 disabled:opacity-50 inline-flex items-center gap-2 shadow-xs"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Confirmar Mapeamento</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & CONFIRM */}
        {step === 'preview' && (
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6 text-center">
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Pronto para iniciar a importação</h3>
              <p className="text-xs text-slate-500 mt-1">
                O arquivo <strong>{importObj?.filename}</strong> foi processado e o mapeamento está configurado.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left max-w-md mx-auto space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Política de Deduplicação:</span>
                <span className="font-semibold text-slate-800">
                  {dedupPolicy === 'update' ? 'Atualizar existentes' : 'Ignorar existentes'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Colunas Mapeadas:</span>
                <span className="font-semibold text-slate-800">
                  {Object.values(mapping).filter((v) => v !== 'ignore').length} colunas
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destino:</span>
                <span className="font-semibold text-slate-800">
                  {destinationType === 'existing'
                    ? `Lista existente #${targetListId}`
                    : destinationType === 'new'
                    ? `Nova Lista: ${targetListName || filename}`
                    : 'Apenas Contatos do CRM'}
                </span>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep('mapping')}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Voltar
              </button>
              <button
                onClick={handleCommitImport}
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2 shadow-xs"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Iniciar Gravação Assíncrona</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PROCESSING & DONE */}
        {(step === 'processing' || step === 'done') && (
          <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-xs text-center space-y-6">
            {step === 'processing' ? (
              <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {step === 'processing' ? 'Importação em processamento...' : 'Importação Concluída!'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {step === 'processing'
                  ? 'Os contatos estão sendo gravados no CRM em segundo plano.'
                  : 'Os contatos foram validados e inseridos no sistema.'}
              </p>
            </div>

            {importObj && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left max-w-md mx-auto space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Linhas Processadas:</span>
                  <span className="font-bold text-slate-900">{importObj.total_rows || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contatos Importados:</span>
                  <span className="font-bold text-emerald-600">{importObj.imported_rows || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duplicatas Tratas:</span>
                  <span className="font-semibold text-slate-700">{importObj.duplicate_rows || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Linhas Inválidas:</span>
                  <span className="font-semibold text-red-600">{importObj.invalid_rows || 0}</span>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-center gap-4">
              <Link
                href="/dashboard/sales/campaigns/audiences/lists"
                className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-semibold text-sm hover:bg-sky-700 transition-colors"
              >
                Ver Listas de Contatos
              </Link>
            </div>
          </div>
        )}
      </div>
    </WorkspaceFrame>
  );
}

function ImportContactsSkeleton() {
  return (
    <WorkspaceFrame title="Audiências">
      <div className="space-y-6">
        <AudienceNavigation activeTab="import" />
        <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6 animate-pulse">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-32 bg-slate-100 rounded-xl" />
        </div>
      </div>
    </WorkspaceFrame>
  );
}

export default function ImportContactsPage() {
  return (
    <Suspense fallback={<ImportContactsSkeleton />}>
      <ImportContactsContent />
    </Suspense>
  );
}

