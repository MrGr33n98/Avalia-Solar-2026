import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Calculator, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { FinancingOption, financingOptionsApi } from '@/lib/api';
import { toast } from 'sonner';

type Props = { companyId: number };

export default function CompanyFinancing({ companyId }: Props) {
  const [financingOptions, setFinancingOptions] = useState<FinancingOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [audience, setAudience] = useState<'pf' | 'pj'>('pf');
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [loanAmount, setLoanAmount] = useState([50000]);

  useEffect(() => {
    loadFinancingOptions();
  }, [audience]);

  const loadFinancingOptions = async () => {
    setLoading(true);
    try {
      const data = await financingOptionsApi.getAll(companyId, { audience });
      const mapped = (data || []).map((opt: any) => ({
        ...opt,
        name: opt.credit_line || opt.institution_name || 'Financiamento',
        institution: opt.institution_name,
        min_rate: opt.interest_rate_percent ?? 0,
        max_months: opt.max_term_months ?? 0,
        grace_period_days: opt.grace_period_months ? opt.grace_period_months * 30 : 0,
      }));
      setFinancingOptions(mapped as any);
    } catch (error) {
      console.error('Error loading financing options:', error);
      toast.error('Erro ao carregar opções de financiamento');
    } finally {
      setLoading(false);
    }
  };

  const handleCompareToggle = (id: number) => {
    setCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      if (prev.length >= 3) {
        toast.warning('Selecione no máximo 3 opções para comparar');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSimulate = () => {
    // Simulação simplificada para demonstração
    const result = financingOptions
      .filter(opt => compareIds.includes(opt.id))
      .map(opt => ({
        ...opt,
        monthlyPayment: opt.max_months ? (loanAmount[0] * (1 + ((opt.min_rate || 0) / 100))) / opt.max_months : 0,
        totalCost: loanAmount[0] * (1 + ((opt.min_rate || 0) / 100))
      }));
    setSimulationResult(result);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Calculator className="h-6 w-6 text-primary" />
            Simulador de Financiamento Solar
          </CardTitle>
          <CardDescription className="text-base">
            Compare as melhores taxas e encontre o financiamento ideal para seu projeto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label className="text-base font-medium">Tipo de Pessoa</Label>
              <RadioGroup 
                defaultValue="pf" 
                value={audience} 
                onValueChange={(v) => setAudience(v as 'pf' | 'pj')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border shadow-sm w-full cursor-pointer hover:border-primary transition-colors">
                  <RadioGroupItem value="pf" id="pf" />
                  <Label htmlFor="pf" className="cursor-pointer flex-1">Pessoa Física</Label>
                </div>
                <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border shadow-sm w-full cursor-pointer hover:border-primary transition-colors">
                  <RadioGroupItem value="pj" id="pj" />
                  <Label htmlFor="pj" className="cursor-pointer flex-1">Pessoa Jurídica</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <Label className="text-base font-medium">Valor do Financiamento</Label>
                <span className="font-bold text-primary text-lg">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(loanAmount[0])}
                </span>
              </div>
              <Slider
                value={loanAmount}
                onValueChange={setLoanAmount}
                max={500000}
                step={1000}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>R$ 0</span>
                <span>R$ 500.000</span>
              </div>
            </div>
          </div>

          {/* Options List */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Selecione opções para comparar (máx. 3)</Label>
            {loading ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : financingOptions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {financingOptions.map((option: any) => (
                  <div 
                    key={option.id}
                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                      compareIds.includes(option.id) 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                    onClick={() => handleCompareToggle(option.id)}
                  >
                    <div className="absolute top-3 right-3">
                      <Checkbox 
                        checked={compareIds.includes(option.id)}
                        onCheckedChange={() => handleCompareToggle(option.id)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>
                    <h3 className="font-bold text-lg mb-1 pr-8">{option.name}</h3>
                    <div className="text-sm text-muted-foreground mb-4">{option.institution}</div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxa a partir de:</span>
                        <span className="font-semibold text-green-600">{option.min_rate}% a.m.</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prazo até:</span>
                        <span className="font-semibold">{option.max_months} meses</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Carência:</span>
                        <span className="font-semibold">{option.grace_period_days} dias</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma opção de financiamento encontrada para este perfil.</p>
              </div>
            )}
          </div>

          <Button 
            onClick={handleSimulate} 
            disabled={compareIds.length === 0}
            size="lg"
            className="w-full md:w-auto font-semibold shadow-md"
          >
            Simular Comparativo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {simulationResult && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
          <h3 className="text-2xl font-bold">Resultado da Simulação</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {simulationResult.map((res: any) => (
              <Card key={res.id} className="border-primary/20 shadow-lg overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                <CardHeader className="bg-muted/10 pb-4">
                  <CardTitle className="text-xl">{res.name}</CardTitle>
                  <CardDescription>{res.institution}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="text-center p-4 bg-primary/5 rounded-xl mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Parcela Estimada</p>
                    <p className="text-3xl font-bold text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(res.monthlyPayment)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">em {res.max_months}x</p>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Custo Total Est.:</span>
                      <span className="font-semibold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(res.totalCost)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Taxa Mensal:</span>
                      <span className="font-semibold">{res.min_rate}%</span>
                    </div>
                  </div>

                  <Button className="w-full mt-4" variant="outline">
                    Solicitar Análise
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
