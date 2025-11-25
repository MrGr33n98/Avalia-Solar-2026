'use client';

/**
 * CompanyInfo - Refatorado com shadcn/ui
 * Exemplo de uso correto dos componentes shadcn/ui
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Users,
  Save,
  X,
  Upload,
  Pencil,
  Loader2,
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Custom hooks
import { useCompany } from '../hooks';

// Types
import type { Company } from '../types';

// Utilities
import { cn, formatPhone, formatCNPJ } from '../utils';

// Validation schema
const companyFormSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  phone: z.string().min(10, 'Telefone inválido'),
  phone_alt: z.string().optional(),
  whatsapp: z.string().optional(),
  email_public: z.string().email('Email inválido'),
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  city: z.string().min(2, 'Cidade inválida'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  linkedin: z.string().optional(),
  working_hours: z.string().optional(),
  payment_methods: z.string().optional(),
  certifications: z.string().optional(),
  awards: z.string().optional(),
  founded_year: z.coerce.number().min(1900).max(new Date().getFullYear()).optional(),
  employees_count: z.coerce.number().positive().optional(),
  languages: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

interface CompanyInfoProps {
  companyId: string;
}

export default function CompanyInfo({ companyId }: CompanyInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  
  const { toast } = useToast();
  const { company, loading, error, updateCompany } = useCompany(companyId);

  // Form setup with validation
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: company || undefined,
  });

  // Update form when company data loads
  useState(() => {
    if (company) {
      form.reset(company);
    }
  });

  const onSubmit = async (data: CompanyFormValues) => {
    try {
      const result = await updateCompany(data);
      
      if (result.success) {
        setPendingApproval(true);
        setIsEditing(false);
        
        toast({
          title: 'Alterações enviadas!',
          description: 'Suas mudanças estão sendo revisadas pela equipe.',
        });

        // Reset pending state after 5 seconds
        setTimeout(() => setPendingApproval(false), 5000);
      } else {
        toast({
          title: 'Erro ao salvar',
          description: result.error || 'Ocorreu um erro inesperado.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    form.reset(company || undefined);
    setIsEditing(false);
  };

  if (loading) {
    return <CompanyInfoSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erro ao carregar informações da empresa: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approval Alert */}
      {pendingApproval && (
        <Alert className="border-amber-500 bg-amber-50">
          <AlertDescription className="text-amber-900">
            <strong>Alterações enviadas para aprovação!</strong>
            <br />
            Suas mudanças estão sendo revisadas e serão publicadas após aprovação.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Informações da Empresa</h2>
          <p className="text-muted-foreground">
            Gerencie as informações básicas e detalhes da sua empresa
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar Informações
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={form.formState.isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="contact">Contato</TabsTrigger>
          <TabsTrigger value="location">Localização</TabsTrigger>
          <TabsTrigger value="additional">Adicional</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Informações Básicas
                  </CardTitle>
                  <CardDescription>
                    Dados fundamentais da empresa
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Empresa *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome da empresa"
                              disabled={!isEditing}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00.000.000/0000-00"
                              disabled={!isEditing}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva sua empresa..."
                            className="min-h-[120px]"
                            disabled={!isEditing}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Descreva os produtos e serviços oferecidos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="founded_year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ano de Fundação</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="2020"
                              disabled={!isEditing}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="employees_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Funcionários</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="50"
                              disabled={!isEditing}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Informações de Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone Principal *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(11) 1234-5678"
                              disabled={!isEditing}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone_alt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone Alternativo</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(11) 98765-4321"
                              disabled={!isEditing}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+5511987654321"
                              disabled={!isEditing}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email_public"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail Público *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="contato@empresa.com"
                              disabled={!isEditing}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://www.empresa.com"
                            disabled={!isEditing}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="@empresa"
                              disabled={!isEditing}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="facebook.com/empresa"
                              disabled={!isEditing}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="linkedin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="linkedin.com/company/empresa"
                              disabled={!isEditing}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Localização
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço Completo *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Rua, número, complemento, bairro"
                            disabled={!isEditing}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="São Paulo"
                              disabled={!isEditing}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="SP"
                              maxLength={2}
                              disabled={!isEditing}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Additional Info Tab */}
            <TabsContent value="additional" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Adicionais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="working_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário de Funcionamento</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Seg-Sex: 9h-18h, Sáb: 9h-13h"
                            disabled={!isEditing}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payment_methods"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Métodos de Pagamento</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Dinheiro, Cartão, Pix, Boleto"
                            disabled={!isEditing}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="certifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certificações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="ISO 9001, ISO 14001, etc."
                            disabled={!isEditing}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="languages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idiomas Atendidos</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Português, Inglês, Espanhol"
                            disabled={!isEditing}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </form>
        </Form>
      </Tabs>
    </div>
  );
}

// Loading Skeleton
function CompanyInfoSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
