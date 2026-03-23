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
  Tag
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
            <Box className="h-6 w-6 text-indigo-500" />
            <h2 className="text-4xl font-black tracking-tighter uppercase text-foreground dark:text-white">
              Supply Chain Command
            </h2>
          </div>
          <p className="text-sm text-muted-foreground font-medium max-w-lg leading-relaxed">
            Orquestração inteligente de ativos, precificação dinâmica e gestão de inventário em tempo real para o ecossistema solar.
          </p>
        </div>
        <div className="flex gap-4">
          <Button 
            onClick={openCreateDialog}
            className="clay-precision bg-indigo-600 hover:bg-indigo-700 text-white h-14 rounded-2xl px-10 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4 mr-3" />
            Deploy New Asset
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
      <Card className="clay-precision bg-card dark:bg-[#0F172A] border-none overflow-hidden">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
            <Input
              placeholder="Filtro Avançado de Ativos (ID, Nome ou SKU)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 rounded-2xl border-none bg-slate-100 dark:bg-white/[0.03] focus-visible:ring-indigo-500/30 text-xs font-bold font-mono tracking-tight"
            />
          </div>
          <Button variant="ghost" className="h-14 rounded-2xl px-6 text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5">
            <Filter className="h-4 w-4 mr-2" />
            Advanced
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
                <Skeleton className="aspect-square w-full rounded-3xl" />
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
            className="flex flex-col items-center justify-center py-32 rounded-[3rem] bg-slate-50 dark:bg-black/20 border border-dashed border-slate-200 dark:border-white/5"
          >
            <div className="h-24 w-24 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center mb-8">
              <Package className="h-10 w-10 text-indigo-500" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-widest mb-2">Zero Assets Detected</h3>
            <p className="text-sm text-muted-foreground font-medium mb-8">Nenhum ativo localizado no banco de dados para os critérios atuais.</p>
            <Button onClick={openCreateDialog} className="h-12 rounded-2xl bg-indigo-600 px-8 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/10">
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="clay-precision bg-card dark:bg-[#0F172A] border-none overflow-hidden group hover:ring-2 hover:ring-indigo-500/20 transition-all cursor-pointer">
                  <div className="aspect-square relative bg-slate-100 dark:bg-black/30 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:scale-110 transition-transform duration-700">
                      <ImageIcon className="h-16 w-16" />
                    </div>
                    
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                      <Badge className={cn(
                        "h-8 rounded-xl font-black text-[9px] uppercase tracking-widest border-none px-4",
                        product.status === 'active' ? "bg-brand-green/10 text-brand-green" : 
                        product.status === 'pending' ? "bg-amber-500/10 text-amber-500" : "bg-slate-500/10 text-slate-500"
                      )}>
                        {product.status}
                      </Badge>
                      {product.featured && (
                        <div className="h-10 w-10 rounded-2xl bg-amber-500/10 backdrop-blur-md flex items-center justify-center shadow-2xl">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button size="icon" onClick={() => openEditDialog(product)} className="h-12 w-12 rounded-2xl bg-white/20 hover:bg-white/40 text-white backdrop-blur-lg border-none shadow-2xl">
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button size="icon" onClick={() => { setSelectedProduct(product); setShowDeleteDialog(true); }} className="h-12 w-12 rounded-2xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-500 backdrop-blur-lg border-none">
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>

                  <CardContent className="p-8 space-y-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black font-mono text-indigo-500 uppercase tracking-[0.2em]">{product.sku || 'N/A'}</p>
                      <h3 className="text-xl font-black tracking-tight uppercase line-clamp-1 group-hover:text-indigo-500 transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-2 h-8">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                       <div className="space-y-0.5">
                         <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Unit Price</p>
                         <p className="text-2xl font-black font-mono tracking-tighter text-foreground dark:text-white">
                            {formatCurrency(typeof product.price === 'string' ? parseFloat(product.price.replace(/[^\d.,]/g, '').replace(',', '.')) : product.price)}
                         </p>
                       </div>
                       <div className="text-right space-y-0.5">
                         <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Frequency</p>
                         <div className="flex items-center gap-2 justify-end">
                            <TrendingUp className="h-3 w-3 text-brand-green" />
                            <p className="text-sm font-black text-foreground/70 dark:text-white/70 uppercase">{product.stock || 0}</p>
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
        <DialogContent className="max-w-4xl clay-precision bg-card dark:bg-[#0F172A] border-none rounded-[2.5rem] p-0 overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 min-h-[600px]">
            {/* Design Metadata */}
            <div className="bg-indigo-600 p-12 text-white flex flex-col justify-between overflow-hidden relative">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="relative z-10">
                <Box className="h-10 w-10 mb-6" />
                <h2 className="text-3xl font-black uppercase tracking-tighter leading-tight mb-4">
                  Asset Protocol Configuration
                </h2>
                <p className="text-sm text-white/60 font-medium leading-relaxed">
                  Defina as especificações técnicas, parâmetros de custo e metadados de mercado para o novo projeto solar.
                </p>
              </div>
              <div className="relative z-10 space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Compliance Status</p>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-indigo-200" />
                    <span className="text-xs font-bold">Standard Solar Integrity v2.4</span>
                  </div>
                </div>
                <div className="h-[0.5px] w-full bg-white/20" />
                <div className="flex items-center gap-2">
                   {[1,2,3,4].map(i => <div key={i} className="h-1 w-6 rounded-full bg-white/40" />)}
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
                            <Input placeholder="Ex: Fotovoltaico Industrial Gen 4" {...field} className="h-14 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/10 text-xs font-bold" />
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
                                <Input type="number" step="0.01" {...field} className="h-14 pl-12 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/10 text-xs font-mono font-bold" />
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
                                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/10 text-xs font-black uppercase">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="clay-precision bg-card border-none rounded-2xl shadow-2xl">
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
                            <Textarea {...field} className="min-h-[120px] rounded-2xl bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/10 text-xs font-medium leading-relaxed" />
                          </FormControl>
                          <FormMessage className="text-[10px] font-black" />
                        </FormItem>
                      )}
                    />

                    <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
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
                      className="h-14 flex-1 rounded-2xl text-[11px] font-black uppercase tracking-widest text-muted-foreground"
                    >
                      Abort Mission
                    </Button>
                    <Button 
                      type="submit" 
                      className="h-14 flex-[2] rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 text-[11px] font-black uppercase tracking-widest transition-all"
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
        <AlertDialogContent className="clay-precision bg-card dark:bg-[#0F172A] border-none rounded-[2rem] p-8 max-w-sm">
          <AlertDialogHeader className="items-center text-center">
            <div className="h-20 w-20 rounded-[1.5rem] bg-rose-500/10 flex items-center justify-center mb-6">
               <AlertCircle className="h-10 w-10 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">Security Alert</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed">
              Tentativa de remoção de ativo detectada. Esta ação causará a <span className="text-rose-500 font-bold">destruição imediata</span> dos metadados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-3 mt-8">
            <AlertDialogAction
              onClick={handleDelete}
              className="h-12 w-full rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-[11px] transition-all"
            >
              Confirm Destruction
            </AlertDialogAction>
            <AlertDialogCancel className="h-12 w-full rounded-2xl border-none bg-slate-100 dark:bg-white/5 font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 dark:hover:bg-white/10 m-0">
              Abort Deletion
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
