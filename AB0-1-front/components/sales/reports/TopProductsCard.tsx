'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

export interface TopProductItem {
  product_id: number;
  name: string;
  category: string;
  deals_count: number;
  total_quantity: number;
  total_revenue_cents: number;
}

export interface TopProductsCardProps {
  products?: TopProductItem[];
  formatCurrency: (cents: number) => string;
}

export const TopProductsCard: React.FC<TopProductsCardProps> = ({ products = [], formatCurrency }) => {
  return (
    <Card className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs rounded-xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-400">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Produtos Mais Vendidos (Products Report)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Ranking de equipamentos e pacotes por receita e volume fechado
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {products.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-6">
            Nenhum item de produto faturado no período selecionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-2 font-bold">Produto</th>
                  <th className="pb-2 font-bold">Categoria</th>
                  <th className="pb-2 font-bold text-center">Negócios</th>
                  <th className="pb-2 font-bold text-center">Qtd Total</th>
                  <th className="pb-2 font-bold text-right">Receita Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((item) => (
                  <tr key={item.product_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">
                      {item.name}
                    </td>
                    <td className="py-2.5 text-slate-500">
                      {item.category}
                    </td>
                    <td className="py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {item.deals_count}
                    </td>
                    <td className="py-2.5 text-center text-slate-600 dark:text-slate-400">
                      {item.total_quantity}
                    </td>
                    <td className="py-2.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.total_revenue_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
