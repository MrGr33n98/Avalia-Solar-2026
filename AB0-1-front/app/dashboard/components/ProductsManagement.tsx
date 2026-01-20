'use client';

/**
 * ProductsManagement - Refatorado com shadcn/ui
 * CRUD completo de produtos com formulário profissional
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Loader2,
  ImageIcon,
} from 'lucide-react';

// shadcn/ui components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

// Types
import type { Product } from '../types';

// Utils
import { cn, formatCurrency } from '../utils';
import { productsApi } from '@/lib/api';

// Validation schema
const productSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(200),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  short_description: z.string().max(500).optional(),
  price: z.coerce.number().positive('Preço deve ser positivo'),
  sku: z.string().optional(),
  stock: z.coerce.number().int().nonnegative('Estoque não pode ser negativo').optional(),
  featured: z.boolean().optional(),
  status: z.enum(['active', 'pending', 'inactive']),
  seo_title: z.string().max(60).optional(),
  seo_description: z.string().max(160).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductsManagementProps {
  companyId: string;
}

export default function ProductsManagement({ companyId }: ProductsManagementProps) {
  const { toast } = useToast();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      short_description: '',
      price: 0,
      sku: '',
      stock: 0,
      featured: false,
      status: 'pending',
      seo_title: '',
      seo_description: '',
    },
  });

  // Handlers
  const openCreateDialog = () => {
    setSelectedProduct(null);
    form.reset({
      name: '',
      description: '',
      short_description: '',
      price: 0,
      sku: '',
      stock: 0,
      featured: false,
      status: 'pending',
      seo_title: '',
      seo_description: '',
    });
    setShowDialog(true);
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    form.reset({
      name: product.name,
      description: product.description,
      short_description: product.short_description || '',
      price: typeof product.price === 'string' ? parseFloat(product.price.replace(/[^\d.,]/g, '').replace(',', '.')) : product.price,
      sku: product.sku || '',
      stock: product.stock || 0,
      featured: product.featured || false,
      status: product.status,
      seo_title: product.seo_title || '',
      seo_description: product.seo_description || '',
    });
    setShowDialog(true);
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setLoading(true);
      if (selectedProduct) {
        const updated = await productsApi.update(Number(selectedProduct.id), {
          ...data,
          company_id: Number(companyId)
        } as any);
        setProducts(products.map(p => p.id === selectedProduct.id ? { ...p, ...updated, price: updated.price } : p));
        toast({ title: 'Produto atualizado!', description: 'Atualização realizada.' });
      } else {
        const created = await productsApi.create({
          ...data,
          company_id: Number(companyId)
        } as any);
        setProducts([...products, { ...created, id: String(created.id), price: created.price }]);
        toast({ title: 'Produto adicionado!', description: 'Produto criado com sucesso.' });
      }

      setShowDialog(false);
      form.reset();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o produto.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      await productsApi.delete(Number(selectedProduct.id));
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      toast({ title: 'Produto removido!', description: 'O produto foi excluído com sucesso.' });

      setShowDeleteDialog(false);
      setSelectedProduct(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o produto.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtered products
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Produtos e Serviços</h2>
          <p className="text-muted-foreground">
            Gerencie seu catálogo de produtos e serviços
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Produto
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery
                ? 'Tente ajustar sua busca.'
                : 'Adicione produtos para exibir no seu perfil.'}
            </p>
            {!searchQuery && (
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Produto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="aspect-video bg-muted flex items-center justify-center rounded-t-lg">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
                    <Badge
                      variant={
                        product.status === 'active'
                          ? 'default'
                          : product.status === 'pending'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {product.status === 'active' ? 'Ativo' : product.status === 'pending' ? 'Pendente' : 'Inativo'}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-2xl font-bold text-primary">
                      {typeof product.price === 'string' 
                        ? product.price 
                        : formatCurrency(product.price)}
                    </p>
                    {product.stock !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        Est: {product.stock}
                      </p>
                    )}
                  </div>

                  {product.featured && (
                    <Badge variant="outline" className="w-full justify-center">
                      ⭐ Destaque
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditDialog(product)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDeleteDialog(product)}
                  className="hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct
                ? 'Atualize as informações do produto.'
                : 'Preencha os dados do novo produto.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Consultoria de Arquitetura" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="short_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição Curta</FormLabel>
                      <FormControl>
                        <Input placeholder="Resumo breve do produto" {...field} />
                      </FormControl>
                      <FormDescription>
                        Aparecer nos cards de visualização
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição Completa *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva detalhadamente o produto..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço (R$) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="1500.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="PROD-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Produto em Destaque</FormLabel>
                          <FormDescription>
                            Aparece no topo do catálogo
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* SEO */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold">SEO (Opcional)</h4>

                  <FormField
                    control={form.control}
                    name="seo_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título SEO</FormLabel>
                        <FormControl>
                          <Input placeholder="Título otimizado para busca" {...field} />
                        </FormControl>
                        <FormDescription>Máximo 60 caracteres</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seo_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição SEO</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descrição otimizada para busca" {...field} />
                        </FormControl>
                        <FormDescription>Máximo 160 caracteres</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Produto'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto &quot;{selectedProduct?.name}&quot;?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>

          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
