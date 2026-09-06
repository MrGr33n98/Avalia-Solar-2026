'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { uploadContactImport, updateImportMapping, commitImport, ContactImport } from '@/lib/api-campaigns';

export default function ImportContactsPage() {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'processing' | 'done'>('upload');
  const [fileContent, setFileContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [importObj, setImportObj] = useState<ContactImport | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [dedupPolicy, setDedupPolicy] = useState<'skip' | 'update'>('update');
  const [targetListName, setTargetListName] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
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
        target_list_name: targetListName,
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
      setStep('done');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao iniciar processamento de importação.');
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/sales/campaigns/audiences"
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Importar Contatos</h1>
          <p className="text-sm text-slate-500">
            Adicione contatos ao CRM via planilha CSV/XLSX com deduplicação automática e aplicação de tags.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Stepper */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold text-slate-500">
        <div className={`p-2 rounded-lg border ${step === 'upload' ? 'bg-sky-50 border-sky-300 text-sky-700 font-bold' : 'bg-slate-50 border-slate-200'}`}>
          1. Upload
        </div>
        <div className={`p-2 rounded-lg border ${step === 'mapping' ? 'bg-sky-50 border-sky-300 text-sky-700 font-bold' : 'bg-slate-50 border-slate-200'}`}>
          2. Mapear Colunas
        </div>
        <div className={`p-2 rounded-lg border ${step === 'preview' ? 'bg-sky-50 border-sky-300 text-sky-700 font-bold' : 'bg-slate-50 border-slate-200'}`}>
          3. Confirmar
        </div>
        <div className={`p-2 rounded-lg border ${step === 'done' || step === 'processing' ? 'bg-sky-50 border-sky-300 text-sky-700 font-bold' : 'bg-slate-50 border-slate-200'}`}>
          4. Concluído
        </div>
      </div>

      {/* STEP 1: UPLOAD */}
      {step === 'upload' && (
        <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-xs text-center space-y-6">
          <div className="w-16 h-16 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-center mx-auto text-sky-600">
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Selecione ou solte a planilha CSV</h3>
            <p className="text-xs text-slate-500 mt-1">Formatos suportados: CSV com separador vírgula ou ponto-e-vírgula.</p>
          </div>

          <div className="max-w-md mx-auto">
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700 cursor-pointer"
            />
          </div>

          {filename && (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
              <FileSpreadsheet className="w-4 h-4 text-sky-600" />
              <span>{filename}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleUploadSubmit}
              disabled={loading || !fileContent}
              className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-semibold text-sm hover:bg-sky-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
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
          <h3 className="text-lg font-bold text-slate-900">Mapeamento de Colunas</h3>
          <p className="text-xs text-slate-500">
            Associe as colunas encontradas na planilha aos campos do CRM Sales.
          </p>

          <div className="space-y-3">
            {Object.keys(mapping).map((col) => (
              <div key={col} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                <span className="font-semibold text-slate-700 w-1/3 truncate">{col}</span>
                <span className="text-slate-400 text-xs">→</span>
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
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Opções de Importação</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Deduplicação de Contatos</label>
                <select
                  value={dedupPolicy}
                  onChange={(e) => setDedupPolicy(e.target.value as 'skip' | 'update')}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="update">Atualizar campos vazios no contato existente</option>
                  <option value="skip">Ignorar contato se o e-mail já existir no CRM</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tags para aplicar (separadas por vírgula)</label>
                <input
                  type="text"
                  placeholder="ex: Lead2026, EventoSolar"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>
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
              className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-semibold text-sm hover:bg-sky-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>Confirmar Mapeamento</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW */}
      {step === 'preview' && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6 text-center">
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Pronto para importar contatos</h3>
            <p className="text-xs text-slate-500 mt-1">
              O arquivo <strong>{importObj?.filename}</strong> foi validado e está pronto para gravação assíncrona.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left max-w-md mx-auto space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Política de Deduplicação:</span>
              <span className="font-semibold text-slate-800">{dedupPolicy === 'update' ? 'Atualizar existentes' : 'Ignorar existentes'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Colunas Mapeadas:</span>
              <span className="font-semibold text-slate-800">{Object.keys(importObj?.mapping || {}).length} colunas</span>
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
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>Iniciar Importação</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PROCESSING / DONE */}
      {(step === 'processing' || step === 'done') && (
        <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-xs text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Importação Iniciada!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Os contatos estão sendo inseridos em segundo plano. Você pode navegar normalmente.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-center gap-4">
            <Link
              href="/dashboard/sales/campaigns/audiences"
              className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-semibold text-sm hover:bg-sky-700 transition-colors"
            >
              Voltar para Audiências
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
