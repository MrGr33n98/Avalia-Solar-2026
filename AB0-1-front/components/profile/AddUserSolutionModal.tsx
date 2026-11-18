'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { track } from '@/lib/analytics/lazy';
import { fetchApi } from '@/lib/api';
import { BrandCatalogCombobox } from '@/components/review-dashboard/brands/BrandCatalogCombobox';
import type { BrandCatalogItem } from '@/lib/api/brands';
import type { UserSolution } from '@/components/profile/UserSolutionChip';

type SolutionType = 'company' | 'product' | 'service' | 'technology';

interface ProductItem {
  id: number;
  name: string;
  sku?: string;
}

interface AddUserSolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (solution: UserSolution) => void | Promise<void>;
}

const USAGE_CONTEXT_OPTIONS = [
  { value: 'integrator_install', label: 'Instalação em projetos de clientes' },
  { value: 'personal_owner', label: 'Uso próprio / residencial' },
  { value: 'designer_specification', label: 'Especificação técnica em projetos' },
  { value: 'maintenance', label: 'Operação e Manutenção (O&M)' },
  { value: 'reseller', label: 'Distribuição / Revenda' },
];

export function AddUserSolutionModal({ open, onOpenChange, onAdd }: AddUserSolutionModalProps) {
  const [selectedBrand, setSelectedBrand] = useState<BrandCatalogItem | null>(null);
  const [brandProducts, setBrandProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Energia Solar');
  const [type, setType] = useState<SolutionType>('technology');
  const [usageContext, setUsageContext] = useState<string>('integrator_install');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setSelectedBrand(null);
    setBrandProducts([]);
    setSelectedProductId(null);
    setName('');
    setCategory('Energia Solar');
    setType('technology');
    setUsageContext('integrator_install');
  };

  useEffect(() => {
    if (open) track('reviewer_solution_add_opened', { source: 'solution_modal' });
  }, [open]);

  // Carrega produtos quando uma marca é selecionada
  const fetchProductsForBrand = useCallback(async (brandId: number) => {
    setLoadingProducts(true);
    try {
      const response = await fetchApi<{ data: ProductItem[] }>(`/products?brand_id=${brandId}&per_page=50`);
      setBrandProducts(response.data || []);
    } catch {
      setBrandProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const handleBrandSelect = (brand: BrandCatalogItem | null) => {
    setSelectedBrand(brand);
    setSelectedProductId(null);
    if (brand) {
      setType('product');
      fetchProductsForBrand(brand.id);
    } else {
      setBrandProducts([]);
    }
  };

  const handleProductSelect = (productIdStr: string) => {
    if (!productIdStr || productIdStr === 'custom') {
      setSelectedProductId(null);
      return;
    }
    const pid = Number(productIdStr);
    setSelectedProductId(pid);
    const prod = brandProducts.find((p) => p.id === pid);
    if (prod) {
      setName(prod.name);
      setType('product');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !category.trim()) {
      toast.error('Informe nome e categoria.');
      return;
    }
    setSaving(true);
    try {
      await onAdd({
        id: name.trim(),
        name: name.trim(),
        type,
        category: category.trim(),
        verified: false,
        brand_id: selectedBrand?.id,
        product_id: selectedProductId || undefined,
        usage_context: usageContext,
        logo_url: selectedBrand?.logo_url || undefined,
      });
      reset();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg bg-white p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar solução sustentável</DialogTitle>
          <DialogDescription>
            Cadastre solução ou equipamento realmente utilizado em suas instalações ou residência.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Seleção de Fabricante Canônico (Opcional) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Fabricante / Marca (Opcional)
            </label>
            <BrandCatalogCombobox
              value={selectedBrand}
              onSelect={handleBrandSelect}
            />
          </div>

          {/* Se a marca possui produtos cadastrados, exibe o combobox de produtos */}
          {selectedBrand && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Modelo / Equipamento cadastrado
              </label>
              <select
                value={selectedProductId ? String(selectedProductId) : 'custom'}
                onChange={(e) => handleProductSelect(e.target.value)}
                disabled={loadingProducts}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#17468D]"
              >
                <option value="custom">
                  {loadingProducts
                    ? 'Carregando modelos...'
                    : brandProducts.length > 0
                    ? '-- Selecione um modelo ou digite abaixo --'
                    : 'Nenhum modelo cadastrado (digite abaixo)'}
                </option>
                {brandProducts.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name} {p.sku ? `(${p.sku})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Nome da solução */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Nome da solução / equipamento *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Inversor 5kW Híbrido, Módulo 550W..."
            />
          </div>

          {/* Categoria e Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Categoria *</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex.: Energia Solar, Baterias..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Tipo de solução</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SolutionType)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#17468D]"
              >
                <option value="company">Empresa</option>
                <option value="product">Produto / Equipamento</option>
                <option value="service">Serviço</option>
                <option value="technology">Tecnologia</option>
              </select>
            </div>
          </div>

          {/* Contexto de atuação */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Contexto de utilização
            </label>
            <select
              value={usageContext}
              onChange={(e) => setUsageContext(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#17468D]"
            >
              {USAGE_CONTEXT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={saving} onClick={handleSubmit}>
            {saving ? 'Salvando...' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
