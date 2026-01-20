'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Calculator, Sun, Zap } from 'lucide-react';
import { openQuoteWizard } from '@/lib/quote-wizard';

export function EnergyCalculator() {
  const [billValue, setBillValue] = React.useState<number>(300);
  const [savings, setSavings] = React.useState<number>(0);
  const [payback, setPayback] = React.useState<number>(0);

  // Constants for estimation (Brazil average)
  // Average kWh price ~ R$ 0.95
  // System cost per kWh monthly generation ~ R$ 60 (simplified)
  // Payback period roughly 3-5 years depending on region
  
  React.useEffect(() => {
    // Simple estimation logic
    const monthlySavings = billValue * 0.95; // Saving 95% of the bill (min tax remains)
    const annualSavings = monthlySavings * 12;
    const estimatedSystemCost = monthlySavings * 40; // Rough heuristic
    const estimatedPaybackMonths = estimatedSystemCost / monthlySavings;
    
    setSavings(annualSavings);
    setPayback(estimatedPaybackMonths / 12);
  }, [billValue]);

  const handleSliderChange = (value: number[]) => {
    setBillValue(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (!isNaN(val) && val >= 0) {
      setBillValue(val);
    }
  };

  return (
    <Card className="w-full bg-white shadow-lg border-primary/10 overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-primary to-yellow-400" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-primary">
          <Calculator className="w-6 h-6" />
          Calculadora Solar
        </CardTitle>
        <CardDescription>
          Estime quanto você pode economizar investindo em energia solar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="bill-value" className="text-base font-semibold text-slate-700">
              Valor da sua conta de luz (R$)
            </Label>
            <div className="relative w-24">
              <span className="absolute left-3 top-2.5 text-slate-500 text-sm">R$</span>
              <Input 
                id="bill-value" 
                type="number" 
                value={billValue} 
                onChange={handleInputChange}
                className="pl-8 text-right font-bold text-slate-900" 
              />
            </div>
          </div>
          
          <Slider 
            defaultValue={[300]} 
            max={2000} 
            step={10} 
            value={[billValue]}
            onValueChange={handleSliderChange}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>R$ 100</span>
            <span>R$ 1.000</span>
            <span>R$ 2.000+</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Economia Anual</p>
            <p className="text-2xl font-extrabold text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(savings)}
            </p>
          </div>
          <div className="space-y-1 border-l border-slate-200 pl-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Payback Estimado</p>
            <p className="text-2xl font-extrabold text-amber-500">
              {payback.toFixed(1)} <span className="text-sm font-normal text-slate-600">anos</span>
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50/50 p-6 pt-0">
        <Button 
          size="lg" 
          className="w-full font-bold shadow-lg shadow-primary/20"
          onClick={() => openQuoteWizard({ source: 'calculator' })}
        >
          <Zap className="w-4 h-4 mr-2 fill-current" />
          Receber Orçamento Real
        </Button>
      </CardFooter>
    </Card>
  );
}
