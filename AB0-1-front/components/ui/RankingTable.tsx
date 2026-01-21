'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type RankingRow = {
  id: string;
  name: string;
  nps: number;
  reviewsCount: number;
  avatarUrl?: string | null;
};

type RankingTableProps = {
  className?: string;
  title?: string;
  rows: RankingRow[];
};

export default function RankingTable({ className, title = 'Posicionamento', rows }: RankingTableProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className={cn('border-gray-200 shadow-sm', className)}>
        <CardHeader className="pb-3">
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <div className="text-xs text-gray-500">NPS e número de avaliações</div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Produto</TableHead>
                <TableHead className="text-xs">NPS</TableHead>
                <TableHead className="text-xs text-right">Nº</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 border border-gray-200">
                        <AvatarImage src={row.avatarUrl || undefined} alt="" />
                        <AvatarFallback className="text-xs font-semibold text-gray-700 bg-gray-100">
                          {(row.name || 'A').slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{row.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-gray-900 tabular-nums">
                    {Number.isFinite(row.nps) ? row.nps.toFixed(2) : '0.00'}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-gray-900 tabular-nums text-right">
                    {Math.max(0, row.reviewsCount || 0)}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-sm text-gray-500 text-center py-8">
                    Sem dados suficientes para exibir o ranking.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

