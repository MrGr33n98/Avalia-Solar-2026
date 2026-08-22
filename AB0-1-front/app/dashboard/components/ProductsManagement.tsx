'use client';

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Image from 'next/image';

import {
  Archive,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileText,
  ImageIcon,
  ImagePlus,
  Layers3,
  Link as LinkIcon,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

import { toast } from '@/hooks/use-toast';
import { fetchApi } from '@/lib/api';

import { cn } from '../utils';
import type { Product } from '../types';
import {
  type CatalogFilters,
  type ProductInput,
  useProducts,
} from '../hooks/useProducts';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type Category = {
  id: string;
  name: string;
};

type ProductStatus = ProductInput['status'];

type ProductEditorValues = {
  name: string;
  sku: string;
  description: string;
  short_description: string;
  price: string;
  price_mode: 'fixed' | 'starting_at' | 'on_request' | 'hidden';
  stock: string;
  status: ProductStatus;
  category_id: string;
  image_url: string;
  images: File[];
  previewUrls: string[];
};

interface ProductsManagementProps {
  companyId: string;
}

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const EMPTY_EDITOR: ProductEditorValues = {
  name: '',
  sku: '',
  description: '',
  short_description: '',
  price: '',
  price_mode: 'fixed',
  stock: '0',
  status: 'draft',
  category_id: '',
  image_url: '',
  images: [],
  previewUrls: [],
};

const STATUS_META: Record<
  ProductStatus,
  {
    label: string;
    className: string;
  }
> = {
  active: {
    label: 'Publicado',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  draft: {
    label: 'Rascunho',
    className:
      'border-blue-200 bg-blue-50 text-blue-700',
  },
  archived: {
    label: 'Arquivado',
    className:
      'border-slate-200 bg-slate-100 text-slate-600',
  },
  disabled: {
    label: 'Desativado',
    className:
      'border-rose-200 bg-rose-50 text-rose-700',
  },
};

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function formatCurrency(value?: number | string | null) {
  const amount = Number(value || 0);

  return Number.isFinite(amount)
    ? new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(amount)
    : '—';
}

function formatDate(value?: string) {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(date);
}

function statusMeta(status?: string) {
  return (
    STATUS_META[status as ProductStatus] ||
    STATUS_META.draft
  );
}

/* -------------------------------------------------------------------------- */
/*                              METRIC CARD                                   */
/* -------------------------------------------------------------------------- */

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  icon: typeof Package;
  tone:
    | 'emerald'
    | 'blue'
    | 'slate'
    | 'amber'
    | 'rose';
  onClick?: () => void;
}) {
  const tones = {
    emerald: {
      icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
      hover: 'hover:border-emerald-200',
    },
    blue: {
      icon: 'bg-blue-50 text-blue-600 ring-blue-100',
      hover: 'hover:border-blue-200',
    },
    slate: {
      icon: 'bg-slate-100 text-slate-600 ring-slate-200',
      hover: 'hover:border-slate-300',
    },
    amber: {
      icon: 'bg-amber-50 text-amber-600 ring-amber-100',
      hover: 'hover:border-amber-200',
    },
    rose: {
      icon: 'bg-rose-50 text-rose-600 ring-rose-100',
      hover: 'hover:border-rose-200',
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 text-left',
        'shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.03)]',
        'transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.07)]',
        tones[tone].hover,
        !onClick && 'cursor-default hover:translate-y-0',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
            tones[tone].icon,
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>

        {onClick && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition group-hover:bg-slate-50 group-hover:text-blue-600">
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="mt-4">
        <strong className="block text-[28px] font-bold tracking-[-0.03em] text-slate-950">
          {value}
        </strong>

        <span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-500">
          {label}
        </span>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export default function ProductsManagement({
  companyId,
}: ProductsManagementProps) {
  const {
    products,
    stats,
    loading,
    filters,
    applyFilters,
    addProduct,
    updateProduct,
    archiveProduct,
  } = useProducts(companyId);

  const [categories, setCategories] = useState<Category[]>(
    [],
  );

  const [filtersDraft, setFiltersDraft] =
    useState<CatalogFilters>({});

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [editor, setEditor] =
    useState<ProductEditorValues>(EMPTY_EDITOR);

  const [saving, setSaving] = useState(false);

  const [archivingId, setArchivingId] =
    useState<string | null>(null);

  /* ------------------------------------------------------------------------ */
  /*                              LOAD CATEGORIES                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let active = true;

    fetchApi<{ data?: Category[] } | Category[]>(
      '/categories',
      {
        params: {
          view: 'cards',
          limit: 200,
        },
      },
    )
      .then((response) => {
        if (!active) return;

        const list = Array.isArray(response)
          ? response
          : response?.data || [];

        setCategories(
          list.map((category) => ({
            id: String(category.id),
            name: category.name,
          })),
        );
      })
      .catch(() => {
        if (active) {
          setCategories([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setFiltersDraft(filters);
  }, [filters]);

  const hasFilters = useMemo(
    () =>
      Object.values(filtersDraft).some(
        (value) =>
          value !== undefined &&
          value !== null &&
          value !== '',
      ),
    [filtersDraft],
  );

  /* ------------------------------------------------------------------------ */
  /*                                MODAL                                     */
  /* ------------------------------------------------------------------------ */

  const openCreate = () => {
    setSelectedProduct(null);
    setEditor(EMPTY_EDITOR);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setSelectedProduct(product);

    const existingUrls = product.image_urls?.length
      ? product.image_urls
      : product.image_url
        ? [product.image_url]
        : [];

    setEditor({
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      short_description:
        product.short_description || '',
      price: String(product.price ?? ''),
      price_mode:
        (product as any).price_mode || 'fixed',
      stock: String(product.stock ?? 0),
      status:
        (product.status as ProductStatus) || 'draft',
      category_id: product.categories?.[0]
        ? String(product.categories[0].id)
        : '',
      image_url: product.image_url || '',
      images: [],
      previewUrls: existingUrls,
    });

    setDialogOpen(true);
  };

  const setEditorField = <
    K extends keyof ProductEditorValues,
  >(
    key: K,
    value: ProductEditorValues[K],
  ) => {
    setEditor((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  /* ------------------------------------------------------------------------ */
  /*                              PRODUCT IMAGES                              */
  /* ------------------------------------------------------------------------ */

  const handleFiles = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(
      event.target.files || [],
    );

    const filePreviews = files.map((file) =>
      URL.createObjectURL(file),
    );

    setEditor((previous) => ({
      ...previous,
      images: [...previous.images, ...files],
      previewUrls: [
        ...previous.previewUrls,
        ...filePreviews,
      ],
    }));
  };

  const handleRemovePreview = (index: number) => {
    setEditor((previous) => {
      const existingImageCount =
        selectedProduct?.image_urls?.length ||
        (selectedProduct?.image_url ? 1 : 0);

      const isNewFile =
        index >= existingImageCount;

      const nextPreviews =
        previous.previewUrls.filter(
          (_, idx) => idx !== index,
        );

      if (isNewFile) {
        const firstNewPreviewIndex =
          previous.previewUrls.length -
          previous.images.length;

        const fileIndex =
          index - firstNewPreviewIndex;

        const nextImages =
          previous.images.filter(
            (_, idx) => idx !== fileIndex,
          );

        return {
          ...previous,
          previewUrls: nextPreviews,
          images: nextImages,
        };
      }

      return {
        ...previous,
        previewUrls: nextPreviews,
      };
    });
  };

  /* ------------------------------------------------------------------------ */
  /*                              SAVE PRODUCT                                */
  /* ------------------------------------------------------------------------ */

  const saveProduct = async () => {
    if (
      !editor.name.trim() ||
      !editor.sku.trim() ||
      !editor.category_id
    ) {
      toast({
        title: 'Preencha os campos obrigatórios',
        description:
          'Nome, SKU e categoria são necessários.',
        variant: 'destructive',
      });

      return;
    }

    if (Number(editor.stock) < 0) {
      toast({
        title: 'Confira os dados comerciais',
        description:
          'O estoque não pode ser negativo.',
        variant: 'destructive',
      });

      return;
    }

    const payload: ProductInput = {
      name: editor.name.trim(),
      sku: editor.sku.trim(),
      description: editor.description.trim(),
      short_description:
        editor.short_description.trim(),
      price: Number(editor.price || 0),
      price_mode: editor.price_mode,
      stock: Number(editor.stock || 0),
      status: editor.status,
      category_ids: [editor.category_id],
      image_url:
        editor.image_url.trim() ||
        editor.previewUrls[0] ||
        '',
      images:
        editor.images.length > 0
          ? editor.images
          : undefined,
    };

    try {
      setSaving(true);

      if (selectedProduct) {
        await updateProduct(
          selectedProduct.id,
          payload,
        );

        toast({
          title: 'Produto atualizado',
          description:
            'As alterações foram salvas no catálogo.',
        });
      } else {
        await addProduct(payload);

        toast({
          title:
            payload.status === 'active'
              ? 'Produto publicado'
              : 'Rascunho criado',
          description:
            'O catálogo foi atualizado com os dados da empresa.',
        });
      }

      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Não foi possível salvar o produto',
        description:
          error instanceof Error
            ? error.message
            : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                             ARCHIVE PRODUCT                              */
  /* ------------------------------------------------------------------------ */

  const handleArchive = async (
    product: Product,
  ) => {
    const confirmed = window.confirm(
      `Arquivar “${product.name}”? Ele deixará de aparecer no catálogo público, mas seus dados serão preservados.`,
    );

    if (!confirmed) return;

    try {
      setArchivingId(product.id);

      await archiveProduct(product.id);

      toast({
        title: 'Produto arquivado',
        description:
          'O item continua disponível para consulta e pode ser reeditado.',
      });
    } catch {
      toast({
        title:
          'Não foi possível arquivar o produto',
        variant: 'destructive',
      });
    } finally {
      setArchivingId(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                                 FILTERS                                  */
  /* ------------------------------------------------------------------------ */

  const applyMetricFilter = (
    next: CatalogFilters,
  ) => {
    setFiltersDraft(next);
    applyFilters(next);
  };

  const clearFilters = () => {
    setFiltersDraft({});
    applyFilters({});
  };

  /* ------------------------------------------------------------------------ */
  /*                                  VIEW                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <section className="mx-auto w-full max-w-[1600px] space-y-6 pb-20">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <header className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white px-5 py-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:px-6 lg:px-7">
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-100/40 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 shadow-sm sm:flex">
              <Package
                className="h-5 w-5"
                strokeWidth={2}
              />
            </div>

            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Dashboard
                </span>

                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />

                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-600">
                  Catálogo
                </span>
              </div>

              <h1 className="text-[26px] font-bold tracking-[-0.035em] text-slate-950 sm:text-[30px]">
                Catálogo de Produtos
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Organize, publique e mantenha
                atualizado o catálogo comercial da
                sua empresa.
              </p>
            </div>
          </div>

          <Button
            onClick={openCreate}
            className={cn(
              'h-11 shrink-0 gap-2 rounded-xl px-5',
              'bg-blue-600 font-semibold text-white',
              'shadow-[0_8px_20px_rgba(37,99,235,0.18)]',
              'transition-all duration-200',
              'hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_12px_28px_rgba(37,99,235,0.25)]',
            )}
          >
            <Plus className="h-4 w-4" />
            Cadastrar produto
          </Button>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* SUMMARY                                                            */}
      {/* ------------------------------------------------------------------ */}

      <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/50 p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          <MetricCard
            label="Publicados"
            value={stats.published}
            icon={CheckCircle2}
            tone="emerald"
            onClick={() =>
              applyMetricFilter({
                status: 'active',
              })
            }
          />

          <MetricCard
            label="Rascunhos"
            value={stats.drafts}
            icon={FileText}
            tone="blue"
            onClick={() =>
              applyMetricFilter({
                status: 'draft',
              })
            }
          />

          <MetricCard
            label="Arquivados"
            value={stats.archived}
            icon={Archive}
            tone="slate"
            onClick={() =>
              applyMetricFilter({
                status: 'archived',
              })
            }
          />

          <MetricCard
            label="Desativados"
            value={stats.disabled}
            icon={X}
            tone="rose"
            onClick={() =>
              applyMetricFilter({
                status: 'disabled',
              })
            }
          />

          <MetricCard
            label="Sem imagem"
            value={stats.without_images}
            icon={ImageIcon}
            tone="amber"
            onClick={() =>
              applyMetricFilter({
                media: 'without_images',
              })
            }
          />

          <MetricCard
            label="Sem especificações"
            value={
              stats.without_specifications
            }
            icon={Layers3}
            tone="amber"
          />

          <MetricCard
            label="Sem preço"
            value={stats.without_price}
            icon={CircleDollarSign}
            tone="amber"
          />

          <MetricCard
            label="Sem estoque"
            value={stats.unavailable_stock}
            icon={Package}
            tone="rose"
            onClick={() =>
              applyMetricFilter({
                stock: 'unavailable',
              })
            }
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CATALOG CARD                                                        */}
      {/* ------------------------------------------------------------------ */}

      <Card className="overflow-hidden rounded-[28px] border-slate-200/70 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
        {/* FILTER BAR */}

        <CardContent className="border-b border-slate-100 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>

                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Filtros do catálogo
                  </h2>

                  <p className="text-xs text-slate-500">
                    Encontre rapidamente os produtos
                    que precisam de atenção.
                  </p>
                </div>
              </div>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(250px,1.8fr)_repeat(4,minmax(135px,1fr))_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <Input
                value={filtersDraft.q || ''}
                onChange={(event) =>
                  setFiltersDraft(
                    (current) => ({
                      ...current,
                      q: event.target.value,
                    }),
                  )
                }
                className="h-11 rounded-xl border-slate-200 bg-slate-50/60 pl-10 shadow-none transition hover:border-slate-300 hover:bg-white focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-500/10"
                placeholder="Buscar por nome, SKU ou descrição"
              />
            </div>

            <Select
              value={
                filtersDraft.status || 'all'
              }
              onValueChange={(value) =>
                setFiltersDraft(
                  (current) => ({
                    ...current,
                    status:
                      value === 'all'
                        ? undefined
                        : value,
                  }),
                )
              }
            >
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-none">
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Todos os status
                </SelectItem>
                <SelectItem value="active">
                  Publicados
                </SelectItem>
                <SelectItem value="draft">
                  Rascunhos
                </SelectItem>
                <SelectItem value="archived">
                  Arquivados
                </SelectItem>
                <SelectItem value="disabled">
                  Desativados
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={
                filtersDraft.category_id || 'all'
              }
              onValueChange={(value) =>
                setFiltersDraft(
                  (current) => ({
                    ...current,
                    category_id:
                      value === 'all'
                        ? undefined
                        : value,
                  }),
                )
              }
            >
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-none">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Todas as categorias
                </SelectItem>

                {categories.map((category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={
                filtersDraft.media || 'all'
              }
              onValueChange={(value) =>
                setFiltersDraft(
                  (current) => ({
                    ...current,
                    media:
                      value === 'all'
                        ? undefined
                        : (value as CatalogFilters['media']),
                  }),
                )
              }
            >
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-none">
                <SelectValue placeholder="Mídia" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Todas as mídias
                </SelectItem>
                <SelectItem value="with_images">
                  Com imagens
                </SelectItem>
                <SelectItem value="without_images">
                  Sem imagens
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={
                filtersDraft.stock || 'all'
              }
              onValueChange={(value) =>
                setFiltersDraft(
                  (current) => ({
                    ...current,
                    stock:
                      value === 'all'
                        ? undefined
                        : (value as CatalogFilters['stock']),
                  }),
                )
              }
            >
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-none">
                <SelectValue placeholder="Estoque" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Todo o estoque
                </SelectItem>
                <SelectItem value="available">
                  Disponível
                </SelectItem>
                <SelectItem value="unavailable">
                  Indisponível
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() =>
                applyFilters(filtersDraft)
              }
              className="h-11 rounded-xl bg-slate-950 px-5 font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Search className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
          </div>
        </CardContent>

        {/* TABLE */}

        <div className="overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow className="border-slate-100 bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="h-12 pl-6 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                  Produto
                </TableHead>

                <TableHead className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                  SKU
                </TableHead>

                <TableHead className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                  Categoria
                </TableHead>

                <TableHead className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                  Marca
                </TableHead>

                <TableHead className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                  Status
                </TableHead>

                <TableHead className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                  Completude
                </TableHead>

                <TableHead className="text-center text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                  Imagens
                </TableHead>

                <TableHead className="text-center text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                  Specs
                </TableHead>

                <TableHead className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                  Preço
                </TableHead>

                <TableHead className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                  Estoque
                </TableHead>

                <TableHead className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                  Atualizado
                </TableHead>

                <TableHead className="pr-6 text-right text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading &&
                Array.from({
                  length: 6,
                }).map((_, index) => (
                  <TableRow
                    key={index}
                    className="border-slate-100"
                  >
                    {Array.from({
                      length: 12,
                    }).map((__, column) => (
                      <TableCell
                        key={column}
                        className={
                          column === 0
                            ? 'pl-6'
                            : ''
                        }
                      >
                        <Skeleton className="h-7 w-full rounded-lg" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading &&
                products.map((product) => {
                  const status = statusMeta(
                    product.status,
                  );

                  const imageCount =
                    product.images_count ??
                    product.image_urls?.length ??
                    0;

                  const specificationsCount =
                    product.specifications_count ??
                    0;

                  const completeness =
                    product.completeness ?? 0;

                  return (
                    <TableRow
                      key={product.id}
                      className="group border-slate-100 transition-colors hover:bg-slate-50/60"
                    >
                      <TableCell className="min-w-[290px] py-4 pl-6">
                        <div className="flex items-center gap-3.5">
                          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm transition group-hover:border-slate-300">
                            {product.image_url ? (
                              <Image
                                src={
                                  product.image_url
                                }
                                alt={product.name}
                                width={56}
                                height={56}
                                unoptimized
                                className="h-full w-full object-contain p-1.5"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    product,
                                  )
                                }
                                title="Adicionar imagem"
                                className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                              >
                                <ImageIcon className="h-4 w-4" />

                                <span className="text-[9px] font-bold uppercase tracking-wide">
                                  Foto
                                </span>
                              </button>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[210px] truncate text-sm font-bold text-slate-900">
                              {product.name}
                            </p>

                            <p className="mt-0.5 max-w-[220px] truncate text-xs leading-5 text-slate-500">
                              {product.short_description ||
                                product.description ||
                                'Sem descrição'}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-xs font-medium text-slate-500">
                        {product.sku || '—'}
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex max-w-[180px] truncate rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700">
                          {product.categories?.[0]
                            ?.name ||
                            'Não informada'}
                        </span>
                      </TableCell>

                      <TableCell className="text-sm font-medium text-slate-600">
                        {product.brand?.name ||
                          'Não informada'}
                      </TableCell>

                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold',
                            status.className,
                          )}
                        >
                          {status.label}
                        </span>
                      </TableCell>

                      <TableCell className="min-w-[130px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-700">
                            {completeness}%
                          </span>

                          {completeness >=
                            80 && (
                            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                          )}
                        </div>

                        <Progress
                          value={completeness}
                          className="mt-2 h-1.5 bg-slate-100"
                        />
                      </TableCell>

                      <TableCell className="text-center">
                        <span className="inline-flex min-w-7 items-center justify-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                          {imageCount}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <span className="inline-flex min-w-7 items-center justify-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                          {specificationsCount}
                        </span>
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-sm font-bold text-slate-900">
                        {(product as any)
                          .price_mode ===
                        'on_request'
                          ? 'Sob consulta'
                          : (product as any)
                                .price_mode ===
                              'hidden'
                            ? '—'
                            : (product as any)
                                  .price_mode ===
                                'starting_at'
                              ? `A partir de ${formatCurrency(
                                  product.price,
                                )}`
                              : formatCurrency(
                                  product.price,
                                )}
                      </TableCell>

                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex rounded-lg px-2 py-1 text-xs font-bold',
                            Number(
                              product.stock || 0,
                            ) > 0
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700',
                          )}
                        >
                          {product.stock ?? 0}
                        </span>
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-xs font-medium text-slate-500">
                        {formatDate(
                          product.updated_at,
                        )}
                      </TableCell>

                      <TableCell className="pr-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            aria-label={`Editar ${product.name}`}
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 rounded-xl border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() =>
                              openEdit(product)
                            }
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            aria-label={`Arquivar ${product.name}`}
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 rounded-xl border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            disabled={
                              archivingId ===
                                product.id ||
                              product.status ===
                                'archived'
                            }
                            onClick={() =>
                              handleArchive(
                                product,
                              )
                            }
                          >
                            {archivingId ===
                            product.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Archive className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

              {!loading &&
                products.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="py-20 text-center"
                    >
                      <div className="mx-auto flex max-w-md flex-col items-center px-6">
                        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm">
                          <Package className="h-6 w-6" />
                        </span>

                        <p className="text-base font-bold text-slate-900">
                          Nenhum produto
                          encontrado
                        </p>

                        <p className="mt-1.5 text-sm leading-6 text-slate-500">
                          {hasFilters
                            ? 'Ajuste ou limpe os filtros para encontrar outros produtos.'
                            : 'Cadastre o primeiro produto da empresa para iniciar o catálogo.'}
                        </p>

                        {!hasFilters && (
                          <Button
                            className="mt-5 h-10 rounded-xl bg-blue-600 px-5 font-semibold hover:bg-blue-700"
                            onClick={openCreate}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Cadastrar produto
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </div>

        <CardContent className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/40 px-6 py-4 text-xs font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Mostrando{' '}
            <strong className="font-bold text-slate-700">
              {products.length}
            </strong>{' '}
            de{' '}
            <strong className="font-bold text-slate-700">
              {stats.total}
            </strong>{' '}
            produtos cadastrados
          </span>

          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Dados do catálogo da empresa
          </span>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* CREATE / EDIT DIALOG                                                */}
      {/* ------------------------------------------------------------------ */}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent
          className={cn(
            'w-[calc(100%-24px)] p-0',
            'max-h-[94vh] overflow-hidden',
            'rounded-[26px]',
            'border border-slate-200/80',
            'bg-white',
            'shadow-[0_30px_100px_-25px_rgba(15,23,42,0.35)]',
            'sm:max-w-[860px]',
          )}
        >
          <div className="flex max-h-[94vh] flex-col">
            {/* HEADER */}

            <DialogHeader className="relative shrink-0 border-b border-slate-100 bg-white px-6 py-5 pr-14 sm:px-7">
              <div className="flex items-start gap-3.5">
                <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 sm:flex">
                  {selectedProduct ? (
                    <Pencil className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </div>

                <div>
                  <DialogTitle className="text-xl font-bold tracking-[-0.025em] text-slate-950">
                    {selectedProduct
                      ? 'Editar produto'
                      : 'Cadastrar produto'}
                  </DialogTitle>

                  <DialogDescription className="mt-1 max-w-xl text-sm leading-5 text-slate-500">
                    Preencha as informações do
                    produto. Nome, SKU e categoria
                    principal são obrigatórios.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* CONTENT */}

            <div className="overflow-y-auto">
              <div className="grid gap-x-5 gap-y-5 px-6 py-6 sm:grid-cols-2 sm:px-7">
                {/* NAME */}

                <div className="space-y-2 sm:col-span-2">
                  <Label
                    htmlFor="product-name"
                    className="text-sm font-bold text-slate-800"
                  >
                    Nome do produto{' '}
                    <span className="text-rose-500">
                      *
                    </span>
                  </Label>

                  <Input
                    id="product-name"
                    value={editor.name}
                    onChange={(event) =>
                      setEditorField(
                        'name',
                        event.target.value,
                      )
                    }
                    placeholder="Ex.: Inversor solar trifásico 50 kW"
                    className="h-11 rounded-xl border-slate-200 bg-white px-3.5 shadow-none transition placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/10"
                  />
                </div>

                {/* SKU */}

                <div className="space-y-2">
                  <Label
                    htmlFor="product-sku"
                    className="text-sm font-bold text-slate-800"
                  >
                    SKU{' '}
                    <span className="text-rose-500">
                      *
                    </span>
                  </Label>

                  <Input
                    id="product-sku"
                    value={editor.sku}
                    onChange={(event) =>
                      setEditorField(
                        'sku',
                        event.target.value,
                      )
                    }
                    placeholder="Código único do produto"
                    className="h-11 rounded-xl border-slate-200 bg-white px-3.5 font-mono text-sm shadow-none placeholder:font-sans placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/10"
                  />
                </div>

                {/* CATEGORY */}

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-800">
                    Categoria principal{' '}
                    <span className="text-rose-500">
                      *
                    </span>
                  </Label>

                  <Select
                    value={
                      editor.category_id ||
                      undefined
                    }
                    onValueChange={(value) =>
                      setEditorField(
                        'category_id',
                        value,
                      )
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-none focus:ring-4 focus:ring-blue-500/10">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>

                    <SelectContent>
                      {categories.map(
                        (category) => (
                          <SelectItem
                            key={
                              category.id
                            }
                            value={
                              category.id
                            }
                          >
                            {category.name}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* PRICE MODE */}

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-800">
                    Modo de preço
                  </Label>

                  <Select
                    value={editor.price_mode}
                    onValueChange={(value) =>
                      setEditorField(
                        'price_mode',
                        value as ProductEditorValues['price_mode'],
                      )
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-none focus:ring-4 focus:ring-blue-500/10">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="fixed">
                        Preço fixo
                      </SelectItem>

                      <SelectItem value="starting_at">
                        A partir de
                      </SelectItem>

                      <SelectItem value="on_request">
                        Sob consulta
                      </SelectItem>

                      <SelectItem value="hidden">
                        Oculto
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* PRICE */}

                <div className="space-y-2">
                  <Label
                    htmlFor="product-price"
                    className="text-sm font-bold text-slate-800"
                  >
                    Preço base
                  </Label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                      R$
                    </span>

                    <Input
                      id="product-price"
                      min="0"
                      step="0.01"
                      type="number"
                      value={editor.price}
                      onChange={(event) =>
                        setEditorField(
                          'price',
                          event.target.value,
                        )
                      }
                      disabled={
                        editor.price_mode ===
                          'on_request' ||
                        editor.price_mode ===
                          'hidden'
                      }
                      className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-none focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/10"
                    />
                  </div>
                </div>

                {/* STOCK */}

                <div className="space-y-2">
                  <Label
                    htmlFor="product-stock"
                    className="text-sm font-bold text-slate-800"
                  >
                    Estoque disponível
                  </Label>

                  <Input
                    id="product-stock"
                    min="0"
                    step="1"
                    type="number"
                    value={editor.stock}
                    onChange={(event) =>
                      setEditorField(
                        'stock',
                        event.target.value,
                      )
                    }
                    className="h-11 rounded-xl border-slate-200 bg-white shadow-none focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/10"
                  />
                </div>

                {/* STATUS */}

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-800">
                    Status
                  </Label>

                  <Select
                    value={editor.status}
                    onValueChange={(value) =>
                      setEditorField(
                        'status',
                        value as ProductStatus,
                      )
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-none focus:ring-4 focus:ring-blue-500/10">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="draft">
                        Rascunho
                      </SelectItem>

                      <SelectItem value="active">
                        Publicado
                      </SelectItem>

                      <SelectItem value="archived">
                        Arquivado
                      </SelectItem>

                      <SelectItem value="disabled">
                        Desativado
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* SHORT DESCRIPTION */}

                <div className="space-y-2">
                  <Label
                    htmlFor="product-short-description"
                    className="text-sm font-bold text-slate-800"
                  >
                    Descrição curta
                  </Label>

                  <Input
                    id="product-short-description"
                    value={
                      editor.short_description
                    }
                    onChange={(event) =>
                      setEditorField(
                        'short_description',
                        event.target.value,
                      )
                    }
                    placeholder="Resumo para cards e listagens"
                    className="h-11 rounded-xl border-slate-200 bg-white shadow-none placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/10"
                  />
                </div>

                {/* MEDIA */}

                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:col-span-2 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                        <ImageIcon className="h-4 w-4" />
                      </span>

                      <div>
                        <Label className="text-sm font-bold text-slate-900">
                          Imagens do produto
                        </Label>

                        <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                          Adicione imagens
                          profissionais do produto.
                          JPG, PNG e WebP são
                          suportados.
                        </p>
                      </div>
                    </div>

                    {editor.images.length >
                      0 && (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />

                        {editor.images.length}{' '}
                        nova(s)
                      </span>
                    )}
                  </div>

                  {editor.previewUrls.length >
                  0 ? (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                      {editor.previewUrls.map(
                        (url, idx) => (
                          <div
                            key={`${url}-${idx}`}
                            className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt="Thumbnail do produto"
                              className="max-h-full max-w-full object-contain"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                handleRemovePreview(
                                  idx,
                                )
                              }
                              title="Remover imagem"
                              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-rose-600 opacity-0 shadow-sm transition hover:bg-rose-50 group-hover:opacity-100"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ),
                      )}

                      <label
                        htmlFor="product-images-add"
                        className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-center transition hover:border-blue-400 hover:bg-blue-50/40"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <Plus className="h-4 w-4" />
                        </span>

                        <span className="mt-2 text-[10px] font-bold text-slate-600">
                          Adicionar
                        </span>

                        <Input
                          id="product-images-add"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          multiple
                          className="hidden"
                          onChange={
                            handleFiles
                          }
                        />
                      </label>
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor="product-images"
                        className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50/30"
                      >
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                          <ImagePlus className="h-5 w-5" />
                        </div>

                        <p className="text-sm font-bold text-slate-800">
                          Clique para escolher
                          imagens
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          JPG, PNG ou WebP
                        </p>
                      </label>

                      <Input
                        id="product-images"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                        className="hidden"
                        onChange={handleFiles}
                      />
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-4">
                    <Label
                      htmlFor="product-image-url"
                      className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700"
                    >
                      <LinkIcon className="h-3.5 w-3.5 text-slate-400" />

                      URL externa

                      <span className="font-normal text-slate-400">
                        (opcional)
                      </span>
                    </Label>

                    <Input
                      id="product-image-url"
                      value={editor.image_url}
                      onChange={(event) =>
                        setEditorField(
                          'image_url',
                          event.target.value,
                        )
                      }
                      placeholder="https://exemplo.com/imagem-do-produto.png"
                      className="h-11 rounded-xl border-slate-200 bg-white text-xs shadow-none placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/10"
                    />
                  </div>
                </div>

                {/* DESCRIPTION */}

                <div className="space-y-2 sm:col-span-2">
                  <Label
                    htmlFor="product-description"
                    className="text-sm font-bold text-slate-800"
                  >
                    Descrição
                  </Label>

                  <Textarea
                    id="product-description"
                    value={editor.description}
                    onChange={(event) =>
                      setEditorField(
                        'description',
                        event.target.value,
                      )
                    }
                    rows={4}
                    placeholder="Descreva aplicações, diferenciais, características e informações importantes sobre o produto."
                    className="min-h-[110px] resize-y rounded-xl border-slate-200 bg-white px-3.5 py-3 shadow-none placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/10"
                  />
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <DialogFooter className="shrink-0 border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur sm:px-7">
              <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setDialogOpen(false)
                  }
                  disabled={saving}
                  className="h-10 rounded-xl border-slate-200 px-5 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  onClick={saveProduct}
                  disabled={saving}
                  className={cn(
                    'h-10 rounded-xl px-5',
                    'bg-blue-600 font-semibold text-white',
                    'shadow-[0_8px_18px_rgba(37,99,235,0.18)]',
                    'transition hover:bg-blue-700 hover:shadow-[0_10px_24px_rgba(37,99,235,0.24)]',
                  )}
                >
                  {saving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}

                  {selectedProduct
                    ? 'Salvar alterações'
                    : editor.status ===
                        'active'
                      ? 'Cadastrar e publicar'
                      : 'Salvar rascunho'}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}