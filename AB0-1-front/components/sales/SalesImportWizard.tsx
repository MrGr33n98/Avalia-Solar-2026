'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Sparkles,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { salesImportsApi, SalesImport, SalesImportRow } from '@/lib/api/sales/imports';

// Campos CRM disponíveis para mapeamento
const CRM_FIELDS = [
  { key: 'company_name', label: 'Nome da Empresa' },
  { key: 'contact_name', label: 'Nome do Contato' },
  { key: 'email', label: 'E-mail Comercial' },
  { key: 'phone', label: 'Telefone / Celular' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'city', label: 'Cidade' },
  { key: 'state', label: 'Estado (UF)' },
  { key: 'segment', label: 'Segmento' },
  { key: 'owner_identifier', label: 'Responsável (Vendedor)' },
  { key: 'stage_identifier', label: 'Estágio do Funil' },
  { key: 'estimated_value', label: 'Valor Estimado (R$)' },
  { key: 'source', label: 'Origem do Lead' },
  { key: 'notes', label: 'Observações' },
  { key: 'tags', label: 'Tags / Etiquetas' },
] as const;

type DuplicateStrategy = 'update_blank_fields_only' | 'overwrite_all' | 'skip_duplicates';

export default function SalesImportWizard() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [rawText, setRawText] = useState('');
  const [activeImport, setActiveImport] = useState<SalesImport | null>(null);
  const [previewRows, setPreviewRows] = useState<SalesImportRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  // columnMap: { csvHeader -> crmFieldKey } (ex: { "empresa" -> "company_name" })
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('update_blank_fields_only');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Gerador de CSV modelo ────────────────────────────────────────────────
  const downloadSampleCsv = () => {
    const rows = [
      'empresa,nome,email,telefone,whatsapp,cidade,estado,site,segmento,cargo,valor_estimado,origem,responsavel,estagio,tags',
      'Solar Tech Indústria,Carlos Mendes,carlos@solartech.com.br,11988776655,11988776655,Campinas,SP,https://solartech.com.br,energia_solar,Diretor,120000,prospeccao,Felipe,Prospect,"solar;premium"',
      'Mercado Real LTDA,Fernanda Lima,fernanda@mercadoreal.com.br,31991234567,31991234567,Belo Horizonte,MG,https://mercadoreal.com.br,energia_solar,Sócia,45000,indicacao,Felipe,Qualificado,"b2b;quente"',
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_importacao_leads_avalia_solar.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── Upload de arquivo ────────────────────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await salesImportsApi.uploadFile(file, 'lead');
      applyImportResponse(res.import);
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao enviar arquivo. Verifique sua sessão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    // Reset para permitir re-upload do mesmo arquivo
    e.target.value = '';
  };

  // ── Drag & Drop ──────────────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  // ── Processar texto colado ───────────────────────────────────────────────
  const handleProcessRawText = async () => {
    if (!rawText.trim()) return setErrorMessage('Cole o conteúdo CSV no campo acima.');
    const blob = new Blob([rawText], { type: 'text/csv;charset=utf-8;' });
    const textFile = new File([blob], 'leads_manual.csv', { type: 'text/csv' });
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await salesImportsApi.uploadFile(textFile, 'lead');
      applyImportResponse(res.import);
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao enviar texto.');
    } finally {
      setLoading(false);
    }
  };

  // ── Aplicar dados do import ao estado do wizard ──────────────────────────
  function applyImportResponse(imp: SalesImport) {
    setActiveImport(imp);

    // Sempre usar os headers originais do CSV (enviados pelo backend como csv_headers)
    // Fallback: chaves do mapping (que são os CSV headers quando o user já mapeou)
    const fileHeaders =
      imp.headers && imp.headers.length > 0
        ? imp.headers
        : Object.keys(imp.mapping || {});

    setHeaders(fileHeaders);
    // O mapping retornado pelo backend é { csvHeader -> crmField }
    setColumnMap(imp.mapping || {});
  }

  // ── Alterar mapeamento de uma coluna ─────────────────────────────────────
  // crmFieldKey: chave do campo CRM (ex: "company_name") ou "" para desassociar
  // newCsvHeader: coluna do CSV selecionada (ex: "empresa")
  const handleColumnMapChange = (crmFieldKey: string, newCsvHeader: string) => {
    setColumnMap((prev) => {
      const next = { ...prev };

      // 1. Remover qualquer entrada anterior que apontava para este campo CRM
      Object.keys(next).forEach((csvH) => {
        if (next[csvH] === crmFieldKey) {
          delete next[csvH];
        }
      });

      // 2. Se selecionou um header real (não ""), criar nova associação
      if (newCsvHeader) {
        // Remover também se este CSV header já estava associado a outro campo
        delete next[newCsvHeader];
        next[newCsvHeader] = crmFieldKey;
      }

      return next;
    });
  };

  // ── Salvar mapeamento → Step 3 ───────────────────────────────────────────
  const handleSaveMapping = async () => {
    if (!activeImport) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await salesImportsApi.updateMapping(activeImport.id, columnMap, {
        duplicate_strategy: duplicateStrategy,
      });
      setActiveImport(res.import);
      // Preservar headers após save (o backend pode atualizar o mapping)
      const updatedHeaders =
        res.import.headers && res.import.headers.length > 0
          ? res.import.headers
          : headers;
      setHeaders(updatedHeaders);

      // Carregar preview de linhas para Step 3
      const rowsRes = await salesImportsApi.getRows(activeImport.id, undefined, 1);
      setPreviewRows(rowsRes.rows.slice(0, 10));
      setStep(3);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar mapeamento.');
    } finally {
      setLoading(false);
    }
  };

  // ── Commit assíncrono → Step 5 ───────────────────────────────────────────
  const handleCommitImport = async () => {
    if (!activeImport) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await salesImportsApi.commitImport(activeImport.id);
      setActiveImport(res.import);
      setStep(5);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao iniciar importação.');
      setLoading(false);
    }
  };

  // ── Polling de status no Step 5 ──────────────────────────────────────────
  useEffect(() => {
    if (step !== 5 || !activeImport) return;

    const TERMINAL_STATUSES = ['completed', 'completed_with_errors', 'failed', 'cancelled'];
    if (TERMINAL_STATUSES.includes(activeImport.status)) {
      setLoading(false);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await salesImportsApi.getImport(activeImport.id);
        setActiveImport(res.import);
        if (TERMINAL_STATUSES.includes(res.import.status)) {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[SalesImportWizard] Polling error', err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [step, activeImport?.id, activeImport?.status]);

  const progressPercent = () => {
    if (!activeImport?.total_rows) return 0;
    return Math.min(100, Math.round((activeImport.processed_rows / activeImport.total_rows) * 100));
  };

  // ── Reiniciar wizard ─────────────────────────────────────────────────────
  const resetWizard = () => {
    setStep(1);
    setActiveImport(null);
    setHeaders([]);
    setColumnMap({});
    setPreviewRows([]);
    setRawText('');
    setErrorMessage('');
    setLoading(false);
  };

  // ── Helpers de status de mapeamento ─────────────────────────────────────
  const mappedFieldsCount = CRM_FIELDS.filter((f) =>
    Object.values(columnMap).includes(f.key)
  ).length;

  const getMappedCsvHeader = (crmFieldKey: string): string => {
    return Object.keys(columnMap).find((k) => columnMap[k] === crmFieldKey) || '';
  };

  return (
    <SalesLayoutWrapper>
      <div className="mx-auto w-full max-w-5xl space-y-6">

        {/* ── Cabeçalho ── */}
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-blue-900 font-semibold text-white">Avalia Solar CRM</Badge>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Módulo de Importação Nativa
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Importar Leads &amp; Prospects
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Suba planilhas CSV com segurança multi-tenant. Processamento 100% assíncrono via Sidekiq.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadSampleCsv}
            className="border-slate-300 bg-white shadow-xs hover:bg-slate-50"
          >
            <Download className="mr-2 h-4 w-4 text-blue-700" /> Baixar Modelo CSV
          </Button>
        </header>

        {/* ── Steps indicator ── */}
        <div className="grid grid-cols-5 gap-2">
          {['1. Arquivo', '2. Mapear', '3. Validar', '4. Revisar', '5. Importar'].map((lbl, idx) => {
            const stepNum = (idx + 1) as any;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div
                key={lbl}
                className={`flex items-center gap-2 rounded-lg border p-2 text-xs font-medium transition ${
                  isActive
                    ? 'border-blue-700 bg-blue-50 text-blue-900'
                    : isDone
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                <div
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-blue-700 text-white' : isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isDone ? '✓' : stepNum}
                </div>
                <span className="truncate">{lbl}</span>
              </div>
            );
          })}
        </div>

        {/* ── Alerta de erro ── */}
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="font-semibold">Erro no processo de importação</p>
              <p className="mt-0.5 text-red-700">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage('')} className="text-red-400 hover:text-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 1 — Upload do Arquivo
        ════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
              <CardTitle className="text-base font-bold text-slate-900">Selecione o arquivo CSV</CardTitle>
              <CardDescription>
                Suportamos delimitadores vírgula (,), ponto e vírgula (;) e tabulação (\t) em UTF-8.
                Máximo: 25 MB · 50.000 linhas.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid w-full grid-cols-2 border border-slate-200 bg-slate-100/80 p-1">
                  <TabsTrigger
                    value="file"
                    className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-950"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Arquivo Local (.CSV / .TXT)
                  </TabsTrigger>
                  <TabsTrigger
                    value="manual"
                    className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-950"
                  >
                    <FileText className="mr-2 h-4 w-4" /> Colar Conteúdo CSV
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Upload local */}
                <TabsContent value="file" className="mt-6 space-y-4">
                  <div
                    className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-300 bg-slate-50/50 hover:border-blue-400 hover:bg-slate-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !loading && fileInputRef.current?.click()}
                    style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && !loading && fileInputRef.current?.click()}
                    aria-label="Área de upload de arquivo CSV"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-10 w-10 animate-spin text-blue-600" />
                        <p className="mt-3 text-sm font-semibold text-slate-700">Processando arquivo...</p>
                        <p className="mt-1 text-xs text-slate-500">Aguarde enquanto analisamos o CSV.</p>
                      </>
                    ) : (
                      <>
                        <Upload className={`h-10 w-10 ${isDragging ? 'text-blue-600' : 'text-blue-700'}`} />
                        <p className="mt-3 text-sm font-semibold text-slate-900">
                          {isDragging ? 'Solte o arquivo aqui' : 'Arraste seu arquivo .CSV aqui'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">ou clique para selecionar</p>
                        <span className="mt-5 inline-flex items-center rounded-lg bg-blue-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-950">
                          Selecionar Arquivo
                        </span>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt,.tsv"
                      onChange={handleFileInputChange}
                      disabled={loading}
                      className="hidden"
                      id="csv-file-input"
                    />
                  </div>
                </TabsContent>

                {/* Tab: Colar CSV */}
                <TabsContent value="manual" className="mt-6 space-y-4">
                  <Textarea
                    rows={7}
                    placeholder={'empresa,nome,email,telefone\nSolar Tech,Carlos,carlos@solar.com,65999998888'}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="border-slate-300 font-mono text-xs"
                    id="csv-text-input"
                  />
                  <Button
                    onClick={handleProcessRawText}
                    disabled={loading || !rawText.trim()}
                    className="w-full bg-blue-900 hover:bg-blue-950"
                    id="process-raw-text-btn"
                  >
                    {loading ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    Enviar para Mapeamento
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 2 — Mapeamento de Colunas
        ════════════════════════════════════════════════════════════ */}
        {step === 2 && activeImport && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Mapeamento Inteligente de Colunas
                  </CardTitle>
                  <CardDescription>
                    Confirme a correspondência entre as colunas da planilha e o CRM.{' '}
                    <strong>{mappedFieldsCount}</strong> de {CRM_FIELDS.length} campos mapeados.
                  </CardDescription>
                </div>
                {headers.length > 0 && (
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800 text-xs">
                    {headers.length} colunas detectadas
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

              {/* Preview das colunas detectadas */}
              {headers.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Colunas detectadas no CSV
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {headers.map((h) => (
                      <span
                        key={h}
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                          Object.keys(columnMap).includes(h)
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {h}
                        {Object.keys(columnMap).includes(h) && (
                          <span className="ml-1 text-blue-500">→ {columnMap[h]}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Grid de mapeamento: para cada campo CRM, o user escolhe qual coluna CSV mapeia */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {CRM_FIELDS.map((field) => {
                  const currentCsvHeader = getMappedCsvHeader(field.key);
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-900">{field.label}</Label>
                      <Select
                        value={currentCsvHeader}
                        onValueChange={(value) => handleColumnMapChange(field.key, value === '__none__' ? '' : value)}
                      >
                        <SelectTrigger
                          className={`border-slate-300 text-sm ${currentCsvHeader ? 'border-blue-300 bg-blue-50/50' : ''}`}
                          id={`map-field-${field.key}`}
                        >
                          <SelectValue placeholder="Selecione coluna..." />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Opção para limpar/desassociar */}
                          <SelectItem value="__none__" className="text-slate-400 italic">
                            — Não mapear —
                          </SelectItem>
                          {headers.map((h) => (
                            <SelectItem key={h} value={h}>
                              <span className="font-medium">{h}</span>
                              {columnMap[h] && columnMap[h] !== field.key && (
                                <span className="ml-1 text-xs text-slate-400">(em uso)</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>

              {/* Aviso se nenhum campo obrigatório mapeado */}
              {!getMappedCsvHeader('company_name') && !getMappedCsvHeader('contact_name') && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                  <span>
                    Mapeie ao menos <strong>Nome da Empresa</strong> ou <strong>Nome do Contato</strong> para continuar.
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)} id="step2-back-btn">
                  Voltar
                </Button>
                <Button
                  onClick={handleSaveMapping}
                  disabled={
                    loading ||
                    (!getMappedCsvHeader('company_name') && !getMappedCsvHeader('contact_name'))
                  }
                  className="bg-blue-900 hover:bg-blue-950 font-semibold"
                  id="save-mapping-btn"
                >
                  {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Mapeamento &amp; Validar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 3 — Resultado da Análise
        ════════════════════════════════════════════════════════════ */}
        {step === 3 && activeImport && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
              <CardTitle className="text-base font-bold text-slate-900">
                Resultado da Análise de Prévia
              </CardTitle>
              <CardDescription>
                Análise concluída para <strong>{activeImport.filename}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-2xl font-bold text-slate-900">{activeImport.total_rows}</div>
                  <div className="text-xs font-semibold text-slate-500">Total Linhas</div>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="text-2xl font-bold text-emerald-800">{activeImport.valid_rows}</div>
                  <div className="text-xs font-semibold text-emerald-700">Linhas Válidas</div>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="text-2xl font-bold text-amber-800">{activeImport.duplicate_rows}</div>
                  <div className="text-xs font-semibold text-amber-700">Duplicadas</div>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="text-2xl font-bold text-red-800">{activeImport.invalid_rows}</div>
                  <div className="text-xs font-semibold text-red-700">Inválidas</div>
                </div>
              </div>

              {/* Preview de linhas */}
              {previewRows.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Prévia das primeiras linhas
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2 text-left text-slate-600 font-semibold">#</th>
                          <th className="px-3 py-2 text-left text-slate-600 font-semibold">Status</th>
                          {Object.keys(previewRows[0]?.raw_data || {}).slice(0, 5).map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-slate-600 font-semibold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row) => (
                          <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-500">{row.row_number}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  row.status === 'valid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : row.status === 'duplicate'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                            {Object.keys(previewRows[0]?.raw_data || {}).slice(0, 5).map((h) => (
                              <td key={h} className="px-3 py-2 text-slate-700 max-w-[140px] truncate">
                                {String(row.raw_data?.[h] || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} id="step3-back-btn">
                  Ajustar Mapeamento
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  className="bg-blue-900 hover:bg-blue-950 font-semibold"
                  id="proceed-to-review-btn"
                >
                  Avançar para Revisão
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 4 — Revisão e Estratégia de Deduplicação
        ════════════════════════════════════════════════════════════ */}
        {step === 4 && activeImport && (
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
                <CardTitle className="text-base font-bold text-slate-900">
                  Estratégia de Deduplicação
                </CardTitle>
                <CardDescription>
                  Escolha como o sistema deve tratar registros existentes no seu tenant.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3 text-sm">
                  {[
                    {
                      value: 'update_blank_fields_only' as DuplicateStrategy,
                      title: 'Atualizar somente campos vazios (Recomendado)',
                      desc: 'Preenche dados ausentes sem sobrescrever contatos consolidados.',
                    },
                    {
                      value: 'overwrite_all' as DuplicateStrategy,
                      title: 'Sobrescrever todos os campos',
                      desc: 'Substitui totalmente as informações existentes pelas novas da planilha.',
                    },
                    {
                      value: 'skip_duplicates' as DuplicateStrategy,
                      title: 'Ignorar duplicados',
                      desc: 'Não altera nem reinsere cadastros que já existem no CRM.',
                    },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-start gap-3 cursor-pointer rounded-lg border border-slate-200 p-3 hover:border-blue-200 hover:bg-blue-50/40 transition"
                    >
                      <input
                        type="radio"
                        name="dup"
                        value={opt.value}
                        checked={duplicateStrategy === opt.value}
                        onChange={() => setDuplicateStrategy(opt.value)}
                        className="mt-0.5 h-4 w-4 text-blue-900"
                        id={`dup-${opt.value}`}
                      />
                      <div>
                        <strong className="text-slate-900">{opt.title}</strong>
                        <p className="mt-0.5 text-xs text-slate-500">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Resumo antes de confirmar */}
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                  <p className="font-semibold">Resumo da importação</p>
                  <ul className="mt-2 space-y-1 text-xs text-blue-800">
                    <li>📄 Arquivo: <strong>{activeImport.filename}</strong></li>
                    <li>📊 Total de linhas: <strong>{activeImport.total_rows}</strong></li>
                    <li>✅ Linhas válidas: <strong>{activeImport.valid_rows}</strong></li>
                    <li>⚠️ Duplicadas: <strong>{activeImport.duplicate_rows}</strong></li>
                    <li>❌ Inválidas: <strong>{activeImport.invalid_rows}</strong></li>
                    <li>🔗 Campos mapeados: <strong>{mappedFieldsCount}</strong></li>
                  </ul>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(3)} id="step4-back-btn">
                    Voltar
                  </Button>
                  <Button
                    onClick={handleCommitImport}
                    disabled={loading}
                    className="bg-blue-900 hover:bg-blue-950 font-semibold px-6"
                    id="commit-import-btn"
                  >
                    <Database className="mr-2 h-4 w-4" />
                    {loading
                      ? 'Iniciando...'
                      : `Confirmar e Processar ${activeImport.valid_rows || activeImport.total_rows} Leads`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 5 — Progresso assíncrono
        ════════════════════════════════════════════════════════════ */}
        {step === 5 && activeImport && (
          <Card className="border-slate-200 shadow-sm text-center p-8">
            <CardContent className="space-y-6">
              {['completed', 'completed_with_errors'].includes(activeImport.status) ? (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Importação Concluída!</h2>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Processamento finalizado.{' '}
                    <strong>{activeImport.created_rows} leads criados</strong> e{' '}
                    <strong>{activeImport.updated_rows} atualizados</strong>.
                  </p>

                  {activeImport.status === 'completed_with_errors' && activeImport.invalid_rows > 0 && (
                    <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                      <span>
                        {activeImport.invalid_rows} linhas não puderam ser importadas.{' '}
                        <a
                          href={salesImportsApi.getErrorsCsvUrl(activeImport.id)}
                          className="font-semibold underline hover:text-amber-900"
                        >
                          Baixar relatório de erros
                        </a>
                      </span>
                    </div>
                  )}

                  <div className="pt-4 flex justify-center gap-3">
                    <Button
                      onClick={() => (window.location.href = '/dashboard/sales/leads')}
                      className="bg-blue-900 hover:bg-blue-950 font-semibold"
                      id="goto-leads-btn"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Ver Leads Importados
                    </Button>
                    <Button variant="outline" onClick={resetWizard} id="import-again-btn">
                      Importar Outra Lista
                    </Button>
                  </div>
                </>
              ) : activeImport.status === 'failed' ? (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-700">
                    <XCircle className="h-10 w-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Falha na Importação</h2>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    {activeImport.error_summary?.fatal_error ||
                      'Ocorreu um erro inesperado. Entre em contato com o suporte.'}
                  </p>
                  <div className="pt-4 flex justify-center gap-3">
                    <Button variant="outline" onClick={resetWizard} id="retry-import-btn">
                      Tentar Novamente
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <RefreshCw className="mx-auto h-12 w-12 text-blue-700 animate-spin" />
                  <h2 className="text-xl font-bold text-slate-900">
                    {activeImport.status === 'queued'
                      ? 'Importação enfileirada no Sidekiq...'
                      : 'Importando seus leads...'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Status atual:{' '}
                    <span className="font-semibold capitalize">{activeImport.status}</span>
                  </p>
                  <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden max-w-lg mx-auto">
                    <div
                      className="bg-blue-700 h-4 transition-all duration-700"
                      style={{ width: `${progressPercent()}%` }}
                    />
                  </div>
                  <div className="text-sm font-semibold text-slate-700">
                    {progressPercent()}% ({activeImport.processed_rows} /{' '}
                    {activeImport.total_rows} processados)
                  </div>
                  <p className="text-xs text-slate-400">
                    Você pode fechar esta janela — o processamento continua em background.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </SalesLayoutWrapper>
  );
}
