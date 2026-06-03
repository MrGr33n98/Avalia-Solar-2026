'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  ImageIcon,
  Box,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Layers,
  Star,
  Settings2,
  ArrowRight,
  Filter,
  DollarSign,
  Tag,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import MetricCard from './MetricCard';

// Types
import type { Product } from '../types';
import { useProducts } from '../hooks/useProducts';
import { cn, formatCurrency } from '../utils';

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
  // Hook
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts(companyId);

  // State
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

  // Analytics Calculation
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.status === 'active').length;
    const featured = products.filter(p => p.featured).length;
    const stockValue = products.reduce((acc, p) => {
      const price = typeof p.price === 'string' ? parseFloat(p.price.replace(/[^\d.,]/g, '').replace(',', '.')) : p.price;
      return acc + (price * (p.stock || 0));
    }, 0);

    return { total, active, featured, stockValue };
  }, [products]);

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

  const onSubmit = async (data: ProductFormValues) => {
    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, data);
        toast({ title: "Produto Atualizado", description: "Sincronização com o catálogo concluída." });
      } else {
        await addProduct(data);
        toast({ title: "Produto Cadastrado", description: "Novo ativo adicionado ao inventário." });
      }
      setShowDialog(false);
    } catch (error) {
      toast({ title: "Erro na Operação", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      await deleteProduct(selectedProduct.id);
      setShowDeleteDialog(false);
      toast({ title: "Produto Excluído", description: "Ativo removido permanentemente." });
    } catch (error) {
      toast({ title: "Erro na Exclusão", variant: "destructive" });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto pb-24">
      {/* Supply Chain Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Box className="h-5 w-5 text-indigo-500" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Gestão de Inventário
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-lg leading-relaxed">
            Orquestração de ativos, precificação e gestão de estoque para o ecossistema solar.
          </p>
        </div>
        <div className="flex gap-4">
          <Button 
            onClick={openCreateDialog}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Analytics Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Inventory"
          value={stats.total}
          icon={Layers}
          change="+12%"
          changeType="positive"
          color="indigo"
        />
        <MetricCard 
          title="Active Assets"
          value={stats.active}
          icon={CheckCircle2}
          change="+5%"
          changeType="positive"
          color="emerald"
        />
        <MetricCard 
          title="Featured Logic"
          value={stats.featured}
          icon={Star}
          change="+2"
          changeType="positive"
          color="amber"
        />
        <MetricCard 
          title="Inventory Value"
          value={formatCurrency(stats.stockValue)}
          icon={BarChart3}
          change="+8.4%"
          changeType="positive"
          color="rose"
        />
      </div>

      {/* Control Bar */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-xl">
        <CardContent className="p-3 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              placeholder="Buscar produtos por nome, SKU ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus-visible:ring-indigo-500/30 text-sm"
            />
          </div>
          <Button variant="outline" className="h-10 rounded-lg px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </CardContent>
      </Card>

      {/* Asset Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Card key={i} className="clay-precision bg-transparent border-none overflow-hidden">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex justify-between pt-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-8 w-1/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        ) : filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="h-24 w-24 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-8">
              <Package className="h-10 w-10 text-indigo-500" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-widest mb-2">Zero Assets Detected</h3>
            <p className="text-sm text-muted-foreground font-medium mb-8">Nenhum ativo localizado no banco de dados para os critérios atuais.</p>
            <Button onClick={openCreateDialog} className="h-12 rounded-xl bg-indigo-600 px-8 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/10">
              Initialize First Command
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {filteredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="group h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer">
                  <div className="aspect-square relative bg-slate-100 dark:bg-black/30 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:scale-110 transition-transform duration-700">
                      <ImageIcon className="h-16 w-16" />
                    </div>
                    
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                      <Badge className={cn(
                        "h-6 rounded-md font-semibold text-[10px] uppercase tracking-wider border-none px-2",
                        product.status === 'active' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : 
                        product.status === 'pending' ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" : "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400"
                      )}>
                        {product.status === 'active' ? 'Ativo' : product.status === 'pending' ? 'Pendente' : 'Inativo'}
                      </Badge>
                      {product.featured && (
                        <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shadow-sm border border-amber-100 dark:border-amber-500/20">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button size="icon" onClick={() => openEditDialog(product)} className="h-10 w-10 rounded-lg bg-white/90 hover:bg-white text-slate-900 border-none shadow-sm">
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button size="icon" onClick={() => { setSelectedProduct(product); setShowDeleteDialog(true); }} className="h-10 w-10 rounded-lg bg-white/90 hover:bg-rose-50 text-rose-500 border-none shadow-sm">
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{product.sku || 'SEM SKU'}</p>
                      <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2 h-8">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                       <div className="space-y-0.5">
                         <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Preço Unitário</p>
                         <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                            {formatCurrency(typeof product.price === 'string' ? parseFloat(product.price.replace(/[^\d.,]/g, '').replace(',', '.')) : product.price)}
                         </p>
                       </div>
                       <div className="text-right space-y-0.5">
                         <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Estoque</p>
                         <div className="flex items-center gap-1.5 justify-end">
                            <Box className="h-3 w-3 text-slate-400" />
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{product.stock || 0}</p>
                         </div>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deploy Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl clay-precision bg-card dark:bg-[#0F172A] border-none rounded-xl p-0 overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 min-h-[600px]">
                        <div className="bg-slate-900 p-12 text-white flex flex-col justify-between overflow-hidden relative">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
              <div className="relative z-10">
                <Box className="h-10 w-10 mb-6 text-indigo-400" />
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  Protocolo de Ativos
                </h2>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  Defina as especificações técnicas, parâmetros de custo e metadados de mercado.
                </p>
              </div>
              <div className="relative z-10 space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status de Compliance</p>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    <span className="text-xs font-semibold text-slate-300">Integridade Solar v2.4</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Logic */}
            <div className="md:col-span-2 p-12 max-h-[90vh] overflow-y-auto">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500">Global Specifications</h3>
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block">System Identifier</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Fotovoltaico Industrial Gen 4" {...field} className="h-14 rounded-xl bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/10 text-xs font-bold" />
                          </FormControl>
                          <FormMessage className="text-[10px] font-black" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block">Economic Unit (BRL)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
                                <Input type="number" step="0.01" {...field} className="h-14 pl-12 rounded-xl bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/10 text-xs font-mono font-bold" />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px] font-black" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block">Cycle Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-14 rounded-xl bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/10 text-xs font-black uppercase">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="clay-precision bg-card border-none rounded-xl shadow-2xl">
                                <SelectItem value="active" className="text-[10px] font-black uppercase">Active Operation</SelectItem>
                                <SelectItem value="pending" className="text-[10px] font-black uppercase">Approval Stage</SelectItem>
                                <SelectItem value="inactive" className="text-[10px] font-black uppercase">Archived Asset</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-[10px] font-black" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block">Deep Repository Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="min-h-[120px] rounded-xl bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/10 text-xs font-medium leading-relaxed" />
                          </FormControl>
                          <FormMessage className="text-[10px] font-black" />
                        </FormItem>
                      )}
                    />

                    <div className="p-6 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <Star className="h-6 w-6 text-indigo-500" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Catalog Priority</p>
                            <p className="text-[11px] font-bold text-muted-foreground">Destacar ativo no topo da listagem técnica</p>
                         </div>
                       </div>
                       <FormField
                        control={form.control}
                        name="featured"
                        render={({ field }) => (
                          <FormControl>
                            <Switch id="featured-switch" aria-label="Destacar produto" checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-indigo-600" />
                          </FormControl>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-8">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setShowDialog(false)}
                      className="h-14 flex-1 rounded-xl text-[11px] font-black uppercase tracking-widest text-muted-foreground"
                    >
                      Abort Mission
                    </Button>
                    <Button 
                      type="submit" 
                      className="h-14 flex-[2] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 text-[11px] font-black uppercase tracking-widest transition-all"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                      Execute Protocol
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Security Check Alert */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="clay-precision bg-card dark:bg-[#0F172A] border-none rounded-xl p-8 max-w-sm">
          <AlertDialogHeader className="items-center text-center">
            <div className="h-20 w-20 rounded-xl bg-rose-500/10 flex items-center justify-center mb-6">
               <AlertCircle className="h-10 w-10 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">Security Alert</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed">
              Tentativa de remoção de ativo detectada. Esta ação causará a <span className="text-rose-500 font-bold">destruição imediata</span> dos metadados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 mt-6">
            <AlertDialogAction
              onClick={handleDelete}
              className="h-11 w-full rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-all"
            >
              Confirmar Exclusão
            </AlertDialogAction>
            <AlertDialogCancel className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 m-0">
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
