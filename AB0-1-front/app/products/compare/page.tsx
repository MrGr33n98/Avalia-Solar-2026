'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { productsApiSafe } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ProductsComparePage() {
  const searchParams = useSearchParams();
  const initialIds = searchParams.get('ids')?.split(',').map((v) => parseInt(v, 10)).filter(Boolean) || [];
  const [ids, setIds] = useState<number[]>(initialIds);
  const [input, setInput] = useState(initialIds.join(','));
  const [data, setData] = useState<{ products: any[]; comparisons: any[] }>({ products: [], comparisons: [] });

  const fetchData = async (targetIds: number[]) => {
    if (!targetIds.length) return;
    const res = await productsApiSafe.compare(targetIds);
    setData({ products: res.products || [], comparisons: res.comparisons || [] });
  };

  useEffect(() => {
    fetchData(ids);
  }, [ids]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = input.split(',').map((v) => parseInt(v.trim(), 10)).filter(Boolean);
    setIds(parsed.slice(0, 4)); // limit to 4
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Comparar Produtos</h1>
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="IDs separados por vírgula (ex: 1,2,3)" />
        <Button type="submit">Comparar</Button>
      </form>

      {data.products.length > 0 ? (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spec</TableHead>
                {data.products.map((p) => (
                  <TableHead key={p.id}>{p.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.comparisons.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="font-medium">
                    {row.label} {row.unit ? `(${row.unit})` : ''}
                  </TableCell>
                  {row.values.map((val: any) => (
                    <TableCell key={`${row.key}-${val.product_id}`}>{val.value ?? '-'}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Selecione pelo menos um produto para comparar.</p>
      )}
    </div>
  );
}
