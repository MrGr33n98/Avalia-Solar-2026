'use client';

import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Link as LinkIcon,
  Plus,
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
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';

type ParsedLead = {
  company: string;
  contact?: string;
  email?: string;
  phone?: string;
  state?: string;
  city?: string;
  value?: string;
  stageKey?: string;
  kwh?: string;
};

const DEFAULT_STAGES = [
  { key: 'prospect', label: 'Prospect (Novo Lead)' },
  { key: 'contacted', label: 'Contatado' },
  { key: 'qualified', label: 'Qualificado' },
  { key: 'discovery', label: 'Diagnóstico Solar' },
  { key: 'proposal', label: 'Proposta Enviada' },
  { key: 'negotiation', label: 'Em Negociação' },
];

export default function SalesImportWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [importMode, setImportMode] = useState<'file' | 'sheets' | 'manual'>('file');
  const [rawText, setRawText] = useState('');
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedLead[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number; errorCount: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Sample CSV template generator
  const downloadSampleCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Empresa,Contato,Email,Telefone,Estado,Cidade,Consumo_kWh,Valor_Proposta,Estagio\n' +
      'Solar Tech Indústria,Carlos Mendes,carlos@solartech.com.br,(11) 98877-6655,SP,Campinas,45000,120000,qualified\n' +
      'Mercado Real LTDA,Fernanda Lima,fernanda@mercadoreal.com.br,(31) 99123-4567,MG,Belo Horizonte,18000,45000,prospect\n' +
      'Hospital São Lucas,Dr. Roberto,roberto@hospitalsaolucas.com.br,(21) 97654-3210,RJ,Niterói,95000,280000,proposal\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'modelo_importacao_leads_avalia_solar.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseDelimitedText(text);
    };
    reader.readAsText(uploadedFile);
  };

  const parseDelimitedText = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setErrorMessage('O arquivo ou conteúdo digitado está vazio.');
      return;
    }

    const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
    const cols = lines[0].split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());
    setHeaders(cols);

    // Initial smart column mapping guesses
    const initialMap: Record<string, string> = {};
    cols.forEach((col) => {
      const lower = col.toLowerCase();
      if (lower.includes('empresa') || lower.includes('company') || lower.includes('razao') || lower.includes('nome')) {
        initialMap['company'] = col;
      } else if (lower.includes('contato') || lower.includes('contact') || lower.includes('pessoa')) {
        initialMap['contact'] = col;
      } else if (lower.includes('mail')) {
        initialMap['email'] = col;
      } else if (lower.includes('fone') || lower.includes('tel') || lower.includes('cel')) {
        initialMap['phone'] = col;
      } else if (lower.includes('uf') || lower.includes('estado') || lower.includes('state')) {
        initialMap['state'] = col;
      } else if (lower.includes('cidade') || lower.includes('city')) {
        initialMap['city'] = col;
      } else if (lower.includes('valor') || lower.includes('value') || lower.includes('ticket') || lower.includes('proposta')) {
        initialMap['value'] = col;
      } else if (lower.includes('estagio') || lower.includes('stage') || lower.includes('fase')) {
        initialMap['stageKey'] = col;
      } else if (lower.includes('kwh') || lower.includes('consumo')) {
        initialMap['kwh'] = col;
      }
    });
    setColumnMap(initialMap);

    const rows: ParsedLead[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map((v) => v.replace(/^["']|["']$/g, '').trim());
      if (values.length === cols.length || values.some((v) => v.length > 0)) {
        const rowData: Record<string, string> = {};
        cols.forEach((col, idx) => {
          rowData[col] = values[idx] || '';
        });
        rows.push({
          company: rowData[initialMap['company'] || cols[0]] || `Empresa Lead ${i}`,
          contact: rowData[initialMap['contact'] || ''] || '',
          email: rowData[initialMap['email'] || ''] || '',
          phone: rowData[initialMap['phone'] || ''] || '',
          state: rowData[initialMap['state'] || ''] || '',
          city: rowData[initialMap['city'] || ''] || '',
          value: rowData[initialMap['value'] || ''] || '',
          stageKey: rowData[initialMap['stageKey'] || ''] || 'prospect',
          kwh: rowData[initialMap['kwh'] || ''] || '',
        });
      }
    }

    setParsedRows(rows);
    setStep(2);
  };

  const handleProcessRawText = () => {
    if (!rawText.trim()) {
      setErrorMessage('Cole os dados no campo de texto para continuar.');
      return;
    }
    parseDelimitedText(rawText);
  };

  const handleProcessSheets = () => {
    if (!sheetsUrl.trim()) {
      setErrorMessage('Informe o link da planilha ou CSV do Google Sheets.');
      return;
    }
    // If user provided Google Sheets Edit link, convert to CSV export format
    let targetUrl = sheetsUrl.trim();
    if (targetUrl.includes('docs.google.com/spreadsheets')) {
      const match = targetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        targetUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
      }
    }

    setImporting(true);
    setErrorMessage('');
    fetch(targetUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Não foi possível baixar a planilha pública. Verifique se o link possui permissão de leitura.');
        return res.text();
      })
      .then((text) => parseDelimitedText(text))
      .catch((err) => setErrorMessage(err.message || 'Erro ao carregar link do Google Sheets.'))
      .finally(() => setImporting(false));
  };

  const handleExecuteImport = async () => {
    setImporting(true);
    setErrorMessage('');

    let success = 0;
    let errors = 0;

    for (const lead of parsedRows) {
      try {
        // Create account
        const accRes = await fetch('/api/v1/sales/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            account: {
              name: lead.company,
              city: lead.city,
              state: lead.state,
            },
          }),
        });

        let accountId: number | null = null;
        if (accRes.ok) {
          const accData = await accRes.json();
          accountId = accData.account?.id || null;
        }

        // Create opportunity
        const rawValue = (lead.value || '').replace(/[^0-9,.]/g, '').replace(',', '.');
        const numValue = parseFloat(rawValue);
        const valueCents = isNaN(numValue) ? 0 : Math.round(numValue * 100);

        const oppRes = await fetch('/api/v1/sales/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            opportunity: {
              account_id: accountId,
              name: `${lead.company} - Oportunidade Solar`,
              stage_key: lead.stageKey || 'prospect',
              value_cents: valueCents > 0 ? valueCents : 2500000,
              probability: lead.stageKey === 'won' ? 100 : lead.stageKey === 'proposal' ? 70 : 30,
            },
          }),
        });

        if (oppRes.ok) {
          success++;
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
    }

    setImporting(false);
    setImportResult({ successCount: success, errorCount: errors });
    setStep(3);
  };

  return (
    <DashboardLayout className="bg-slate-50/70">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-blue-900 font-semibold text-white">Avalia Solar CRM</Badge>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Módulo de Importação</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Importar Leads & Prospects</h1>
            <p className="mt-1 text-sm text-slate-600">
              Suba listas da sua prospecção externa via arquivos .CSV, planilhas do Google Sheets ou colagem rápida.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadSampleCsv} className="border-slate-300 bg-white shadow-xs hover:bg-slate-50">
            <Download className="mr-2 h-4 w-4 text-blue-700" /> Baixar Planilha Modelo (.CSV)
          </Button>
        </header>

        {/* Wizard Progress Steps */}
        <div className="grid grid-cols-3 gap-3">
          <div
            className={`flex items-center gap-3 rounded-lg border p-3 text-sm font-medium transition ${
              step === 1 ? 'border-blue-700 bg-blue-50/70 text-blue-900' : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                step === 1 ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </div>
            <span>Seletor de Fonte</span>
          </div>
          <div
            className={`flex items-center gap-3 rounded-lg border p-3 text-sm font-medium transition ${
              step === 2 ? 'border-blue-700 bg-blue-50/70 text-blue-900' : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                step === 2 ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </div>
            <span>Mapeamento & Prévia</span>
          </div>
          <div
            className={`flex items-center gap-3 rounded-lg border p-3 text-sm font-medium transition ${
              step === 3 ? 'border-blue-700 bg-blue-50/70 text-blue-900' : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                step === 3 ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </div>
            <span>Conclusão</span>
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: SOURCE SELECTOR */}
        {step === 1 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
              <CardTitle className="text-base font-bold text-slate-900">Escolha o formato dos seus dados</CardTitle>
              <CardDescription>Suportamos arquivos locais, links públicos do Google Sheets ou texto formatado.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="file" onValueChange={(val) => setImportMode(val as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 border border-slate-200 bg-slate-100/80 p-1">
                  <TabsTrigger value="file" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-950">
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Arquivo Local (.CSV / .XLSX)
                  </TabsTrigger>
                  <TabsTrigger value="sheets" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-950">
                    <LinkIcon className="mr-2 h-4 w-4" /> Link Google Sheets
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-950">
                    <FileText className="mr-2 h-4 w-4" /> Colar Tabela / CSV
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: FILE UPLOAD */}
                <TabsContent value="file" className="mt-6 space-y-4">
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-6 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50/20">
                    <Upload className="h-10 w-10 text-blue-700" />
                    <p className="mt-3 text-sm font-semibold text-slate-900">Arraste seu arquivo .CSV ou .XLSX aqui</p>
                    <p className="mt-1 text-xs text-slate-500">Tamanho máximo: 10MB · Codificação UTF-8 recomendada</p>

                    <label className="mt-5 inline-flex cursor-pointer items-center rounded-lg bg-blue-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-950">
                      Selecionar Arquivo
                      <input type="file" accept=".csv,.txt,.tsv" onChange={handleFileUpload} className="hidden" />
                    </label>

                    {file && (
                      <div className="mt-4 flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-900">
                        <FileSpreadsheet className="h-4 w-4 text-blue-700" />
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TAB 2: GOOGLE SHEETS */}
                <TabsContent value="sheets" className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sheets-url" className="text-sm font-semibold text-slate-900">
                      Link público da planilha Google Sheets
                    </Label>
                    <Input
                      id="sheets-url"
                      placeholder="https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit"
                      value={sheetsUrl}
                      onChange={(e) => setSheetsUrl(e.target.value)}
                      className="min-h-11 border-slate-300"
                    />
                    <p className="text-xs text-slate-500">
                      💡 <strong>Dica:</strong> No Google Sheets, clique em <em>Arquivo → Compartilhar → Publicar na Web</em> ou torne o link visível para leitura.
                    </p>
                  </div>
                  <Button
                    onClick={handleProcessSheets}
                    disabled={importing || !sheetsUrl.trim()}
                    className="min-h-11 w-full bg-blue-900 font-semibold hover:bg-blue-950"
                  >
                    {importing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Baixar e Processar Planilha
                  </Button>
                </TabsContent>

                {/* TAB 3: PASTE TEXT */}
                <TabsContent value="manual" className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="raw-csv" className="text-sm font-semibold text-slate-900">
                      Cole as linhas da sua tabela ou CSV aqui
                    </Label>
                    <Textarea
                      id="raw-csv"
                      rows={8}
                      placeholder="Empresa;Contato;Email;Telefone;Valor&#10;Solar Tech;Carlos;carlos@solar.com;(11)9999-8888;50000"
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      className="border-slate-300 font-mono text-xs"
                    />
                  </div>
                  <Button
                    onClick={handleProcessRawText}
                    disabled={!rawText.trim()}
                    className="min-h-11 w-full bg-blue-900 font-semibold hover:bg-blue-950"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" /> Avançar para Mapeamento
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: MAPPING & PREVIEW */}
        {step === 2 && (
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">Mapeamento de Colunas do CRM</CardTitle>
                    <CardDescription>Relacione as colunas da sua planilha com os campos oficiais do Avalia Solar Sales CRM.</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 font-bold text-blue-900">
                    {parsedRows.length} Leads Identificados
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-900">Empresa (Obrigatório)</Label>
                    <Select
                      value={columnMap['company'] || ''}
                      onValueChange={(val) => setColumnMap((prev) => ({ ...prev, company: val }))}
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

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-900">Nome do Contato</Label>
                    <Select
                      value={columnMap['contact'] || ''}
                      onValueChange={(val) => setColumnMap((prev) => ({ ...prev, contact: val }))}
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

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-900">E-mail Comercial</Label>
                    <Select
                      value={columnMap['email'] || ''}
                      onValueChange={(val) => setColumnMap((prev) => ({ ...prev, email: val }))}
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

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-900">Telefone / WhatsApp</Label>
                    <Select
                      value={columnMap['phone'] || ''}
                      onValueChange={(val) => setColumnMap((prev) => ({ ...prev, phone: val }))}
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

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-900">Valor Estimado (R$)</Label>
                    <Select
                      value={columnMap['value'] || ''}
                      onValueChange={(val) => setColumnMap((prev) => ({ ...prev, value: val }))}
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

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-900">Estágio Inicial</Label>
                    <Select
                      value={columnMap['stageKey'] || ''}
                      onValueChange={(val) => setColumnMap((prev) => ({ ...prev, stageKey: val }))}
                    >
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Selecione coluna ou padrão..." />
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
                </div>
              </CardContent>
            </Card>

            {/* PREVIEW TABLE */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="p-4 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">Prévia dos primeiros 5 Leads</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Empresa</th>
                      <th className="p-3">Contato</th>
                      <th className="p-3">E-mail</th>
                      <th className="p-3">Telefone</th>
                      <th className="p-3">UF / Cidade</th>
                      <th className="p-3">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">{row.company}</td>
                        <td className="p-3 text-slate-600">{row.contact || '—'}</td>
                        <td className="p-3 text-slate-600">{row.email || '—'}</td>
                        <td className="p-3 text-slate-600">{row.phone || '—'}</td>
                        <td className="p-3 text-slate-600">
                          {[row.state, row.city].filter(Boolean).join(' / ') || '—'}
                        </td>
                        <td className="p-3 font-semibold text-blue-900">{row.value || 'R$ 25.000'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="border-slate-300">
                Voltar
              </Button>
              <Button
                onClick={handleExecuteImport}
                disabled={importing || parsedRows.length === 0}
                className="bg-blue-900 hover:bg-blue-950 min-h-11 font-semibold px-6 shadow-sm"
              >
                {importing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Importando {parsedRows.length} Leads...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" /> Confirmar e Importar {parsedRows.length} Leads para o CRM
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS / RESULTS */}
        {step === 3 && importResult && (
          <Card className="border-slate-200 shadow-sm text-center p-8">
            <CardContent className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Importação Concluída com Sucesso!</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                <strong>{importResult.successCount} leads e oportunidades</strong> foram inseridos diretamente no seu pipeline comercial do Avalia Solar.
              </p>

              <div className="pt-4 flex justify-center gap-3">
                <Button onClick={() => (window.location.href = '/dashboard/sales')} className="bg-blue-900 hover:bg-blue-950 font-semibold min-h-11 px-6">
                  Ir para o Kanban de Vendas
                </Button>

                <Button variant="outline" onClick={() => { setStep(1); setFile(null); setRawText(''); setParsedRows([]); }} className="border-slate-300">
                  Importar Outra Lista
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
