'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare } from 'lucide-react';

export function ChecklistCard() {
  return (
    <Card className="border-slate-100 shadow-sm overflow-hidden bg-white">
      <CardHeader className="pb-2 bg-slate-50/50">
        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-primary" />
          Checklist Popular
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative aspect-video w-full">
          <Image 
            src="/images/compare-solar-v1.png" // Placeholder
            alt="Checklist Energia Solar"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
            <h4 className="text-white font-bold text-lg leading-tight shadow-black drop-shadow-md">
              Guia Completo de Energia Solar Residencial
            </h4>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Guia passo a passo da instalação
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Checklist para validar orçamentos
            </li>
          </ul>
          <Button className="w-full font-bold" size="sm">
            Baixar Checklist
          </Button>
          <p className="text-[10px] text-center text-slate-400">
            Mais de 1.000 downloads este mês
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
