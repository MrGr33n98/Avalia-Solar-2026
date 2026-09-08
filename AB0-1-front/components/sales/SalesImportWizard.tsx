'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Link as LinkIcon,
  RefreshCw,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { salesImportsApi, SalesImport, SalesImportRow } from '@/lib/api/sales/imports';

export default function SalesImportWizard() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [activeImport, setActiveImport] = useState<SalesImport | null>(null);
  const [previewRows, setPreviewRows] = useState<SalesImportRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [duplicateStrategy, setDuplicateStrategy] = useState<'update_blank_fields_only' | 'overwrite_all' | 'skip_duplicates'>('update_blank_fields_only');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sample CSV generator
  const downloadSampleCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'empresa,nome,email,telefone,whatsapp,cidade,estado,site,segmento,cargo,valor_estimado,origem,responsavel,estagio,tags\n' +
      'Solar Tech Indústria,Carlos Mendes,carlos@solartech.com.br,11988776655,11988776655,Campinas,SP,https://solartech.com.br,energia_solar,Diretor,120000,prospeccao,Felipe,Prospect,"solar;premium"\n' +
      'Mercado Real LTDA,Fernanda Lima,fernanda@mercadoreal.com.br,31991234567,31991234567,Belo Horizonte,MG,https://mercadoreal.com.br,energia_solar,Sócia,45000,indicacao,Felipe,Qualificado,"b2b;quente"\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'modelo_importacao_leads_avalia_solar.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Step 1: Upload File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await salesImportsApi.uploadFile(uploadedFile, 'lead');
      setActiveImport(res.import);
      const fileHeaders = res.import.headers && res.import.headers.length > 0
        ? res.import.headers
        : Object.keys(res.import.mapping || {});
      setHeaders(fileHeaders);
      setColumnMap(res.import.mapping || {});
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao enviar arquivo.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Process Text or Google Sheets by converting to File
  const handleProcessRawText = async () => {
    if (!rawText.trim()) return setErrorMessage('Cole o conteúdo CSV.');
    const blob = new Blob([rawText], { type: 'text/csv;charset=utf-8;' });
    const textFile = new File([blob], 'leads_manual.csv', { type: 'text/csv' });
    setLoading(true);
    try {
      const res = await salesImportsApi.uploadFile(textFile, 'lead');
      setActiveImport(res.import);
      const fileHeaders = res.import.headers && res.import.headers.length > 0
        ? res.import.headers
        : Object.keys(res.import.mapping || {});
      setHeaders(fileHeaders);
      setColumnMap(res.import.mapping || {});
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao enviar texto.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Save Column Mapping
  const handleSaveMapping = async () => {
    if (!activeImport) return;
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await salesImportsApi.updateMapping(activeImport.id, columnMap, { duplicate_strategy: duplicateStrategy });
      setActiveImport(res.import);

      // Load preview rows
      const rowsRes = await salesImportsApi.getRows(activeImport.id, undefined, 1);
      setPreviewRows(rowsRes.rows);
      setStep(3);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar mapeamento.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 -> 4: Review Preview
  const handleProceedToReview = () => {
    setStep(4);
  };

  // Step 4: Commit Async Processing & Poll Status (Step 5)
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

  // Polling import progress when in Step 5
  useEffect(() => {
    if (step !== 5 || !activeImport) return;

    const interval = setInterval(async () => {
      try {
        const res = await salesImportsApi.getImport(activeImport.id);
        setActiveImport(res.import);

        if (['completed', 'completed_with_errors', 'failed', 'cancelled'].includes(res.import.status)) {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [step, activeImport?.id]);

  const calculateProgressPercent = () => {
    if (!activeImport || !activeImport.total_rows) return 0;
    return Math.min(100, Math.round((activeImport.processed_rows / activeImport.total_rows) * 100));
  };

  return (
    <SalesLayoutWrapper>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-blue-900 font-semibold text-white">Avalia Solar CRM</Badge>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Módulo de Importação Nativa</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Importar Leads & Prospects</h1>
            <p className="mt-1 text-sm text-slate-600">
              Suba planilhas CSV com segurança multi-tenant. Processamento 100% assíncrono via Sidekiq.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadSampleCsv} className="border-slate-300 bg-white shadow-xs hover:bg-slate-50">
            <Download className="mr-2 h-4 w-4 text-blue-700" /> Baixar Modelo CSV
          </Button>
        </header>

        {/* Wizard Steps indicator */}
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
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-blue-700 text-white' : isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {stepNum}
                </div>
                <span className="truncate">{lbl}</span>
              </div>
            );
          })}
        </div>

        {errorMessage && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
              <CardTitle className="text-base font-bold text-slate-900">Selecione o arquivo CSV</CardTitle>
              <CardDescription>Suportamos delimitadores vírgula (,), ponto e vírgula (;) e tabulação (\t) em UTF-8.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid w-full grid-cols-2 border border-slate-200 bg-slate-100/80 p-1">
                  <TabsTrigger value="file" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-950">
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Arquivo Local (.CSV / .TXT)
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-950">
                    <FileText className="mr-2 h-4 w-4" /> Colar Conteúdo CSV
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="mt-6 space-y-4">
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-6 py-10 text-center hover:border-blue-400">
                    <Upload className="h-10 w-10 text-blue-700" />
                    <p className="mt-3 text-sm font-semibold text-slate-900">Arraste seu arquivo .CSV aqui</p>
                    <p className="mt-1 text-xs text-slate-500">Tamanho máximo: 25 MB · Limite: 50.000 linhas</p>

                    <label className="mt-5 inline-flex cursor-pointer items-center rounded-lg bg-blue-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-950">
                      {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Selecionar Arquivo
                      <input type="file" accept=".csv,.txt,.tsv" onChange={handleFileUpload} disabled={loading} className="hidden" />
                    </label>
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="mt-6 space-y-4">
                  <Textarea
                    rows={6}
                    placeholder="empresa,nome,email,telefone&#10;Solar Tech,Carlos,carlos@solar.com,65999998888"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="border-slate-300 font-mono text-xs"
                  />
                  <Button onClick={handleProcessRawText} disabled={loading || !rawText.trim()} className="w-full bg-blue-900 hover:bg-blue-950">
                    {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                    Enviar para Mapeamento
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: MAPPING */}
        {step === 2 && activeImport && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
              <CardTitle className="text-base font-bold text-slate-900">Mapeamento Inteligente de Colunas</CardTitle>
              <CardDescription>Confirme a correspondência entre as colunas da planilha e o CRM.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
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
                ].map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-900">{field.label}</Label>
                    <Select
                      value={Object.keys(columnMap).find((k) => columnMap[k] === field.key) || ''}
                      onValueChange={(csvHeader) => {
                        setColumnMap((prev) => ({ ...prev, [csvHeader]: field.key }));
                      }}
                    >
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Selecione coluna..." />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button onClick={handleSaveMapping} disabled={loading} className="bg-blue-900 hover:bg-blue-950 font-semibold">
                  {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar Mapeamento & Validar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: VALIDATE & PREVIEW STATS */}
        {step === 3 && activeImport && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
              <CardTitle className="text-base font-bold text-slate-900">Resultado da Análise de Prévia</CardTitle>
              <CardDescription>Análise concluída para o arquivo {activeImport.filename}.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-4 gap-4 text-center">
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

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Ajustar Mapeamento
                </Button>
                <Button onClick={handleProceedToReview} className="bg-blue-900 hover:bg-blue-950 font-semibold">
                  Avançar para Revisão
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: REVIEW & DEDUPLICATION STRATEGY */}
        {step === 4 && activeImport && (
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
                <CardTitle className="text-base font-bold text-slate-900">Estratégia de Deduplicação</CardTitle>
                <CardDescription>Escolha como o sistema deve tratar registros existentes no seu tenant.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3 text-sm">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="dup"
                      value="update_blank_fields_only"
                      checked={duplicateStrategy === 'update_blank_fields_only'}
                      onChange={() => setDuplicateStrategy('update_blank_fields_only')}
                      className="h-4 w-4 text-blue-900"
                    />
                    <div>
                      <strong className="text-slate-900">Atualizar somente campos vazios (Recomendado)</strong>
                      <p className="text-xs text-slate-500">Preenche dados ausentes sem sobrescrever contatos consolidados.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="dup"
                      value="overwrite_all"
                      checked={duplicateStrategy === 'overwrite_all'}
                      onChange={() => setDuplicateStrategy('overwrite_all')}
                      className="h-4 w-4 text-blue-900"
                    />
                    <div>
                      <strong className="text-slate-900">Sobrescrever todos os campos</strong>
                      <p className="text-xs text-slate-500">Substitui totalmente as informações existentes pelas novas da planilha.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="dup"
                      value="skip_duplicates"
                      checked={duplicateStrategy === 'skip_duplicates'}
                      onChange={() => setDuplicateStrategy('skip_duplicates')}
                      className="h-4 w-4 text-blue-900"
                    />
                    <div>
                      <strong className="text-slate-900">Ignorar duplicados</strong>
                      <p className="text-xs text-slate-500">Não altera nem reinsere cadastros que já existem no CRM.</p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    Voltar
                  </Button>
                  <Button onClick={handleCommitImport} disabled={loading} className="bg-blue-900 hover:bg-blue-950 font-semibold px-6">
                    <Database className="mr-2 h-4 w-4" /> Confirmar e Processar {activeImport.total_rows} Leads Assincronamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 5: ASYNC PROCESSING & PROGRESS */}
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
                    Processamento finalizado. <strong>{activeImport.created_rows} leads criados</strong> e <strong>{activeImport.updated_rows} atualizados</strong>.
                  </p>

                  {activeImport.invalid_rows > 0 && (
                    <div className="pt-2">
                      <a
                        href={salesImportsApi.getErrorsCsvUrl(activeImport.id)}
                        className="inline-flex items-center text-xs font-semibold text-blue-900 hover:underline"
                      >
                        <Download className="mr-1 h-4 w-4" /> Baixar Relatório de Erros ({activeImport.invalid_rows} erros)
                      </a>
                    </div>
                  )}

                  <div className="pt-4 flex justify-center gap-3">
                    <Button onClick={() => (window.location.href = '/dashboard/sales/leads')} className="bg-blue-900 hover:bg-blue-950 font-semibold">
                      Ir para o Workspace de Leads
                    </Button>
                    <Button variant="outline" onClick={() => { setStep(1); setActiveImport(null); setFile(null); }}>
                      Importar Outra Lista
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <RefreshCw className="mx-auto h-12 w-12 text-blue-700 animate-spin" />
                  <h2 className="text-xl font-bold text-slate-900">Importando seus leads via Sidekiq...</h2>
                  <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden max-w-lg mx-auto">
                    <div className="bg-blue-700 h-4 transition-all duration-500" style={{ width: `${calculateProgressPercent()}%` }} />
                  </div>
                  <div className="text-sm font-semibold text-slate-700">
                    {calculateProgressPercent()}% ({activeImport.processed_rows} / {activeImport.total_rows} processados)
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </SalesLayoutWrapper>
  );
}
