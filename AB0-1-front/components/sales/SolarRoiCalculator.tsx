'use client';

import { useState } from 'react';
import {
  Calculator,
  Check,
  ChevronRight,
  Copy,
  DollarSign,
  FileSpreadsheet,
  Leaf,
  MessageSquare,
  Sparkles,
  Sun,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SolarRoiCalculator({
  companyName = 'Cliente Solar',
}: {
  companyName?: string;
}) {
  const [monthlyBill, setMonthlyBill] = useState<number>(3500);
  const [tariff, setTariff] = useState<number>(0.95);
  const [uf, setUf] = useState<string>('MT');
  const [copied, setCopied] = useState<boolean>(false);

  // Irradiation multipliers approx (kWh/kWp/month)
  const irradiationMap: Record<string, number> = {
    MT: 145,
    GO: 142,
    MG: 138,
    SP: 130,
    RJ: 132,
    PR: 122,
    RS: 120,
    BA: 150,
    PE: 148,
    CE: 152,
  };

  const monthlyKwh = Math.round(monthlyBill / (tariff || 0.95));
  const irradiation = irradiationMap[uf] || 135;
  const systemKwp = Number((monthlyKwh / irradiation).toFixed(2));
  
  // Cost approx per kWp (R$ 3.200 ~ R$ 3.800 per kWp for C&I)
  const estimatedInvestment = Math.round(systemKwp * 3400);
  
  // Monthly savings ~ 90% of bill
  const monthlySavings = Math.round(monthlyBill * 0.90);
  const annualSavings = monthlySavings * 12;
  const savings25Years = annualSavings * 25;

  // Simple payback in months and years
  const paybackMonths = Math.round((estimatedInvestment / monthlySavings) * 10) / 10;
  const paybackYears = (paybackMonths / 12).toFixed(1);

  const generateSummaryText = () => {
    return `☀️ *Estudo de Viabilidade Fotovoltaica — Avalia Solar*
Empresa: ${companyName} (${uf})

📊 *Diagnóstico Atual:*
• Gasto Mensal Atual: R$ ${monthlyBill.toLocaleString('pt-BR')}
• Consumo Estimado: ${monthlyKwh.toLocaleString('pt-BR')} kWh/mês

💡 *Dimensionamento Recomendado:*
• Potência Geradora: *${systemKwp} kWp*
• Investimento Estimado: R$ ${estimatedInvestment.toLocaleString('pt-BR')}

💰 *Retorno Financeiro:*
• Economia Mensal Estimada: *R$ ${monthlySavings.toLocaleString('pt-BR')}*
• Economia Anual: R$ ${annualSavings.toLocaleString('pt-BR')}
• Economia em 25 anos: R$ ${savings25Years.toLocaleString('pt-BR')}
• *Payback Estimado: ${paybackYears} anos (${paybackMonths} meses)*

🌱 *Impacto Ambiental:*
• Redução de ~${(systemKwp * 0.4).toFixed(1)} toneladas de CO₂/ano`;
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(generateSummaryText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(generateSummaryText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 font-bold">
          <Calculator className="mr-1.5 h-3.5 w-3.5 text-emerald-700" /> Calculadora ROI Solar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-white border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge className="border-0 bg-emerald-700 font-bold text-white">Sales Intelligence Tool</Badge>
            <span className="text-xs text-slate-500 font-semibold">Simulador Expresso de Payback</span>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Calculadora Comercial de ROI & Usina Fotovoltaica
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Simule instantaneamente o tamanho da usina, economia mensal e payback para apresentar ao cliente em tempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {/* Inputs Section */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" /> Parâmetros de Consumo
            </h3>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Conta de Luz Mensal Atual (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                <Input
                  type="number"
                  value={monthlyBill}
                  onChange={(e) => setMonthlyBill(Number(e.target.value) || 0)}
                  className="pl-9 bg-white border-slate-300 font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Tarifa (R$/kWh)</Label>
                <Input
                  type="number"
                  step="0.05"
                  value={tariff}
                  onChange={(e) => setTariff(Number(e.target.value) || 0.95)}
                  className="bg-white border-slate-300 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Estado / UF</Label>
                <Select value={uf} onValueChange={setUf}>
                  <SelectTrigger className="bg-white border-slate-300 text-xs font-semibold">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(irradiationMap).map((state) => (
                      <SelectItem key={state} value={state}>
                        {state} (Rad. {irradiationMap[state]} kWh/kWp)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-950 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Sun className="h-3.5 w-3.5 text-amber-600" /> Consumo Calculado: {monthlyKwh.toLocaleString('pt-BR')} kWh/mês
              </p>
              <p className="text-[11px] text-blue-800">
                Considera média de radiação solar regional ({uf}: {irradiation} kWh/kWp/mês).
              </p>
            </div>
          </div>

          {/* Calculated Output Section */}
          <div className="space-y-4 rounded-xl border border-blue-900/20 bg-blue-950/5 p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" /> Resultado Expresso
              </h3>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white p-3 border border-slate-200">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Potência Recomendada</p>
                  <p className="text-xl font-extrabold text-blue-950 mt-0.5">{systemKwp} kWp</p>
                </div>

                <div className="rounded-lg bg-white p-3 border border-slate-200">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Investimento Aprox.</p>
                  <p className="text-xl font-extrabold text-blue-950 mt-0.5">R$ {(estimatedInvestment / 1000).toFixed(0)}k</p>
                </div>

                <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200">
                  <p className="text-[10px] font-bold uppercase text-emerald-800">Economia Mensal</p>
                  <p className="text-lg font-extrabold text-emerald-900 mt-0.5">R$ {monthlySavings.toLocaleString('pt-BR')}</p>
                </div>

                <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
                  <p className="text-[10px] font-bold uppercase text-amber-800">Payback Estimado</p>
                  <p className="text-lg font-extrabold text-amber-900 mt-0.5">{paybackYears} anos</p>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-white p-3 border border-slate-200 text-xs space-y-1">
                <p className="font-semibold text-slate-800">
                  <strong>Economia em 25 anos:</strong> R$ {savings25Years.toLocaleString('pt-BR')}
                </p>
                <p className="text-[11px] text-slate-500">
                  Considera vida útil dos painéis monocristalinos tier 1 de 25+ anos.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySummary}
                className="w-full sm:w-1/2 border-slate-300 bg-white hover:bg-slate-50 font-bold text-xs"
              >
                {copied ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-3.5 w-3.5 text-slate-600" /> Copiar Resumo
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={handleSendWhatsApp}
                className="w-full sm:w-1/2 bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-xs"
              >
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Enviar WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
