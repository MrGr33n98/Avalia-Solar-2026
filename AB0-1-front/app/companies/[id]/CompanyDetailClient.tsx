'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Star,
  MapPin,
  Phone,
  Globe,
  Shield,
  Award,
  Users,
  Calendar,
  MessageCircle,
  ChevronsRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import WhatsappButton from '@/components/WhatsappButton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Company, Product, Review } from '@/lib/api';
import { productsApiSafe, reviewsApiSafe } from '@/lib/api-client';
import ProductCard from '@/components/ProductCard';
import ReviewCard from '@/components/ReviewCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import CompanyInfo from '@/app/dashboard/components/CompanyInfo';

interface CompanyDetailClientProps {
  company: Company;
}

export default function CompanyDetailClient({ company }: CompanyDetailClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const canEdit = isAuthenticated && user?.role === 'company' && user?.company_id === company.id;
  const enabledRawInit = (company as any).cta_whatsapp_enabled ?? (company as any).whatsapp_enabled;
  const [ctaEnabled, setCtaEnabled] = useState<boolean>(enabledRawInit === undefined || enabledRawInit === null ? true : Boolean(enabledRawInit));
  const [ctaUrl, setCtaUrl] = useState<string | null>((company as any).cta_whatsapp_url || (company as any).whatsapp_url || company.whatsapp || null);

  // Função para garantir que as URLs das imagens sejam absolutas
  const getFullImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api.*$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Memoização das URLs
  const bannerUrl = useMemo(() => {
    const url = getFullImageUrl(company?.banner_url);
    console.log('[CompanyDetailClient] Banner URL:', {
      original: company?.banner_url,
      processed: url
    });
    return url;
  }, [company?.banner_url]);
  
  const logoUrl = useMemo(() => {
    const url = getFullImageUrl(company?.logo_url);
    console.log('[CompanyDetailClient] Logo URL:', {
      original: company?.logo_url,
      processed: url
    });
    return url;
  }, [company?.logo_url]);

  useEffect(() => {
    if (!company?.id) {
      setError('Dados da empresa não encontrados');
      setProductsLoading(false);
      setReviewsLoading(false);
      return;
    }

    const fetchCompanyData = async () => {
      try {
        // Primeiro tenta pegar cache
        const cachedProducts = sessionStorage.getItem(`products_${company.id}`);
        const cachedReviews = sessionStorage.getItem(`reviews_${company.id}`);

        if (cachedProducts) {
          setProducts(JSON.parse(cachedProducts));
          setProductsLoading(false);
        }
        if (cachedReviews) {
          setReviews(JSON.parse(cachedReviews));
          setReviewsLoading(false);
        }

        // Busca os dados mais recentes em paralelo
        const [productsResponse, reviewsResponse] = await Promise.allSettled([
          productsApiSafe.getAll({ company_id: company.id }),
          reviewsApiSafe.getAll({ company_id: company.id }),
        ]);

        if (productsResponse.status === 'fulfilled') {
          setProducts(productsResponse.value || []);
          sessionStorage.setItem(`products_${company.id}`, JSON.stringify(productsResponse.value));
        }

        if (reviewsResponse.status === 'fulfilled') {
          const onlyThisCompany = (reviewsResponse.value || []).filter((r: any) => String((r as any).company_id) === String(company.id));
          setReviews(onlyThisCompany);
          sessionStorage.setItem(`reviews_${company.id}`, JSON.stringify(onlyThisCompany));
        }

        setError(null);
      } catch (error) {
        console.error('Erro ao buscar dados da empresa:', error);
        setError('Erro ao carregar dados da empresa');
      } finally {
        setProductsLoading(false);
        setReviewsLoading(false);
      }
    };

    fetchCompanyData();
  }, [company?.id]);

  useEffect(() => {
    const onVisibility = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const refreshed = await (await import('@/lib/api')).companiesApi.getById(company.id);
          if (refreshed) {
            const enabledRaw = (refreshed as any).cta_whatsapp_enabled ?? (refreshed as any).whatsapp_enabled;
            setCtaEnabled(enabledRaw === undefined || enabledRaw === null ? true : Boolean(enabledRaw));
            setCtaUrl((refreshed as any).cta_whatsapp_url || (refreshed as any).whatsapp_url || refreshed.whatsapp || null);
          }
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [company.id]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">{error}</h1>
          <Button onClick={() => router.push('/companies')}>Voltar para lista de empresas</Button>
        </div>
      </div>
    );
  }

  // Estatísticas da empresa
  const avgRating =
    reviews.length > 0 ? reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length : 0;

  const companyStats = {
    rating: avgRating,
    reviewCount: reviews.length,
    completedProjects: products.length * 10,
    yearsInBusiness: new Date().getFullYear() - new Date(company.created_at).getFullYear(),
    services: company.services_offered && company.services_offered.length > 0 ? company.services_offered : [
      'Instalação Residencial',
      'Instalação Comercial',
      'Instalação Industrial',
      'Manutenção e Suporte',
      'Consultoria Energética',
    ],
    certifications: ['ANEEL', 'CREA', 'ISO 9001'],
    stats: [
      { label: 'Produtos', value: `${products.length}+`, icon: Award },
      { label: 'Avaliações', value: `${reviews.length}`, icon: Users },
      {
        label: 'Anos no Mercado',
        value: `${new Date().getFullYear() - new Date(company.created_at).getFullYear()}+`,
        icon: Calendar,
      },
      { label: 'Avaliação Média', value: `${avgRating.toFixed(1)}/5`, icon: Star },
    ],
  };

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <section className="relative bg-card py-12 shadow-sm rounded-b-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Botão de Voltar */}
          <div className="mb-4">
            <Button
              variant="outline"
              className="group text-muted-foreground hover:text-foreground border-border hover:bg-muted transition-colors"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Voltar
            </Button>
          </div>

          {/* Banner */}
          <div className="relative w-full mb-8">
            <div className="relative w-full h-[180px] sm:h-[200px] md:h-[220px]">
              {bannerUrl && !bannerError ? (
                <Image
                  src={bannerUrl}
                  alt={`${company.name} banner`}
                  fill
                  priority
                  className="object-cover rounded-2xl shadow-lg"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  onError={() => setBannerError(true)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-2xl">
                  <span className="text-gray-500">Banner não disponível</span>
                </div>
              )}
            </div>
          </div>

          {/* Info da empresa */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 -mt-24 z-10 relative">
            <div className="bg-card p-4 rounded-2xl shadow-xl border border-border flex items-center">
              <div className="mr-6">
                {logoUrl && !logoError ? (
                  <Image
                    src={logoUrl}
                    alt={company.name}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full border object-cover bg-gray-100 shadow-sm"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full mr-3 bg-gray-200 flex items-center justify-center border">
                    <Image
                      src="/images/logo-placeholder.svg"
                      alt="Logo placeholder"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full"
                    />
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-4xl font-extrabold text-foreground mb-2">{company.name}</h1>
                <p className="text-lg text-muted-foreground">{company.description}</p>
                {company.project_types && company.project_types.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {company.project_types.map((t) => (
                      <Badge key={t} variant="outline">{t}</Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center mt-4 space-x-6">
                  <div className="flex items-center">
                    <div className="flex items-center mr-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.round(companyStats.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xl font-bold text-foreground">
                      {companyStats.rating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      ({companyStats.reviewCount} reviews)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 transition-colors shadow-md text-primary-foreground"
                onClick={() => router.push(`/companies/${company.id}/quote`)}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Solicitar Orçamento
              </Button>
              {ctaEnabled && ctaUrl && (
                <WhatsappButton
                  size="lg"
                  enabled
                  href={ctaUrl}
                  styles={{ variant: 'solid' }}
                  preset="brandSolid"
                  className="text-foreground"
                  label="Conversar no WhatsApp"
                />
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-12">
            <Tabs defaultValue="overview" className="space-y-8">
              <TabsList className="grid w-full grid-cols-5 bg-card p-2 rounded-xl shadow-sm border border-border">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="products">Produtos</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="gallery">Galeria</TabsTrigger>
                <TabsTrigger value="stats">Estatísticas</TabsTrigger>
                {canEdit && (
                  <TabsTrigger value="edit">Editar</TabsTrigger>
                )}
              </TabsList>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2">
                  {/* Overview */}
                  <TabsContent value="overview" className="space-y-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>Sobre a Empresa</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed mb-6">
                          {company.description}
                        </p>
                        <div className="mb-6">
                          <h4 className="font-semibold mb-3">Tipos de Projetos</h4>
                          <div className="flex flex-wrap gap-2">
                            {(company.project_types || []).map((t) => (
                              <Badge key={t} variant="outline">{t}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="font-semibold mb-3">Serviços Oferecidos</h4>
                            <ul className="space-y-2">
                              {companyStats.services.map((service) => (
                                <li key={service} className="flex items-center text-muted-foreground">
                                  <ChevronsRight className="w-4 h-4 text-primary mr-2" />
                                  {service}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-3">Certificações</h4>
                            <div className="flex flex-wrap gap-3">
                              {companyStats.certifications.map((cert) => (
                                <Badge key={cert} variant="outline">
                                  <Shield className="w-4 h-4 mr-2 text-primary" />
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Products */}
                  <TabsContent value="products">
                    <Card>
                      <CardHeader>
                        <CardTitle>Produtos da Empresa</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {productsLoading ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[...Array(4)].map((_, i) => (
                              <Skeleton key={i} className="h-80 rounded-2xl bg-muted" />
                            ))}
                          </div>
                        ) : products.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {products.map((product) => (
                              <ProductCard key={product.id} product={product as any} />
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Nenhum produto cadastrado ainda.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Reviews */}
                  <TabsContent value="reviews">
                    <Card>
                      <CardHeader className="flex justify-between items-center">
                        <CardTitle>Avaliações dos Clientes</CardTitle>
                        <Button
                          size="sm"
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => router.push(`/companies/${company.id}/review`)}
                        >
                          + Deixar Avaliação
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {reviewsLoading ? (
                          <div className="space-y-6">
                            {[...Array(3)].map((_, i) => (
                              <Skeleton key={i} className="h-48 rounded-2xl bg-muted" />
                            ))}
                          </div>
                        ) : reviews.length > 0 ? (
                          <div className="space-y-6">
                            {reviews.map((review) => (
                              <ReviewCard key={review.id} review={review} />
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center space-y-4">
                            <p className="text-muted-foreground">Nenhuma avaliação ainda.</p>
                            <Button
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                              onClick={() => router.push(`/companies/${company.id}/review`)}
                            >
                              Seja o primeiro a avaliar
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Stats */}
                  <TabsContent value="stats">
                    <Card>
                      <CardHeader>
                        <CardTitle>Estatísticas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {companyStats.stats.map((stat, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, delay: index * 0.1 }}
                              className="flex flex-col items-center text-center p-4 bg-muted rounded-xl"
                            >
                              <stat.icon className="h-6 w-6 mb-2 text-primary" />
                              <div className="text-2xl font-bold">{stat.value}</div>
                              <div className="text-sm text-muted-foreground">{stat.label}</div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  {canEdit && (
                    <TabsContent value="edit" className="space-y-8">
                      <Card>
                        <CardHeader>
                          <CardTitle>Editar Empresa</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CompanyInfo companyId={String(company.id)} />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações de Contato</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="flex items-center space-x-4">
                        <Phone className="h-5 w-5 text-primary" />
                        <span>{company.phone}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Globe className="h-5 w-5 text-primary" />
                        <a href={company.website} target="_blank" rel="noopener noreferrer">
                          {company.website}
                        </a>
                      </div>
                      <div className="flex items-start space-x-4">
                        <MapPin className="h-5 w-5 text-primary mt-1" />
                        <span>{company.address}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  );
}
