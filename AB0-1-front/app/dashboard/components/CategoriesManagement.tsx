'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, CheckCircle2, XCircle, Clock, Star, Trash2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { fetchApi, categoriesApi } from '@/lib/api';

interface CategoriesManagementProps {
  companyId: string;
}

interface Category {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'rejected';
  featured: boolean;
  seo_url: string;
}

export default function CategoriesManagement({ companyId }: CategoriesManagementProps) {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchAvailableCategories();
  }, [companyId]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const resp = await fetchApi<{ categories: Category[] }>(`/companies/${companyId}/categories`);
      setCategories((resp?.categories || []).map(c => ({
        id: String(c.id),
        name: c.name,
        status: (c.status as any) || 'active',
        featured: !!c.featured,
        seo_url: c.seo_url
      })));
    } catch (e) {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCategories = async () => {
    try {
      const all = await categoriesApi.getAll();
      const currentIds = new Set(categories.map(c => c.id));
      setAvailableCategories((all || []).map(c => ({
        id: String(c.id),
        name: c.name,
        status: (c.status as any) || 'active',
        featured: !!c.featured,
        seo_url: c.seo_url
      })).filter(c => !currentIds.has(c.id)));
    } catch (e) {
      setAvailableCategories([]);
    }
  };

  const handleAddCategories = async () => {
    if (selectedCategories.length === 0) {
      setShowAddDialog(false);
      return;
    }
    try {
      await fetchApi('/company_dashboard/add_categories', {
        method: 'POST',
        body: JSON.stringify({ category_ids: selectedCategories })
      });
      await fetchCategories();
      await fetchAvailableCategories();
    } finally {
      setSelectedCategories([]);
      setShowAddDialog(false);
    }
  };

  const handleRemoveCategory = async (categoryId: string) => {
    if (!confirm('Tem certeza que deseja remover esta categoria?')) return;
    try {
      await fetchApi('/company_dashboard/remove_category', {
        method: 'POST',
        body: JSON.stringify({ category_id: categoryId })
      });
      await fetchCategories();
      await fetchAvailableCategories();
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Gerenciamento de Categorias</h2>
          <p className="text-muted-foreground">
            Selecione as categorias em que sua empresa será listada
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Categorias
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Categorias</DialogTitle>
              <DialogDescription>
                Selecione as categorias que você deseja adicionar. Elas serão enviadas para aprovação.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {availableCategories.map((category) => (
                <div key={category.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <Checkbox
                    id={`cat-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCategories([...selectedCategories, category.id]);
                      } else {
                        setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                      }
                    }}
                  />
                  <label htmlFor={`cat-${category.id}`} className="flex-1 cursor-pointer">
                    <div className="font-medium">{category.name}</div>
                    <div className="text-xs text-muted-foreground">{category.seo_url}</div>
                  </label>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddCategories} disabled={selectedCategories.length === 0}>
                Adicionar ({selectedCategories.length})
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Qualquer alteração nas categorias precisa ser aprovada pela equipe do ActiveAdmin antes de ser publicada.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {category.name}
                      {category.featured && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{category.seo_url}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCategory(category.id)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {category.status === 'active' && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Ativa
                    </Badge>
                  )}
                  {category.status === 'pending' && (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Pendente
                    </Badge>
                  )}
                  {category.status === 'rejected' && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejeitada
                    </Badge>
                  )}
                  {category.featured && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                      Destaque
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {categories.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma categoria adicionada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Adicione categorias para que sua empresa seja encontrada pelos clientes certos.
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Categoria
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
