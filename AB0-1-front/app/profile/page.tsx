'use client';

import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Edit,
  Save,
  X,
  Star,
  MessageCircle,
  Building,
  Scale,
  Trash2,
} from 'lucide-react';
import { companiesApi, reviewsApi, Company, Review } from '@/lib/api';
import CompanyCard from '@/components/CompanyCard';
import ReviewCard from '@/components/ReviewCard';
import { useComparison } from '@/hooks/useComparison';
import {
  AvatarUploadClientError,
  prepareAvatarFileForUpload,
  uploadUserAvatar,
} from '@/lib/avatar-upload';
import { getApiErrorMessage } from '@/lib/api-error';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ name: '', email: '', phone: '' });
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState<string | null>(null);
  const [pendingAvatarPreviewUrl, setPendingAvatarPreviewUrl] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);

  const { user, loading, error, logout, refreshAuth } = useAuth();
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const pendingPreviewObjectUrlRef = useRef<string | null>(null);

  const resetPendingAvatarState = () => {
    setPendingAvatarFile(null);
    setAvatarUploadProgress(0);
    setAvatarError(null);
    if (pendingPreviewObjectUrlRef.current) {
      URL.revokeObjectURL(pendingPreviewObjectUrlRef.current);
      pendingPreviewObjectUrlRef.current = null;
    }
    setPendingAvatarPreviewUrl(null);
  };

  useEffect(() => {
    if (user) {
      setEditedUser({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });

      // Fetch user's companies and reviews
      fetchUserCompanies();
      fetchUserReviews();
    }
  }, [user]);

  useEffect(() => {
    setAvatarDisplayUrl(user?.avatar_url || null);
  }, [user?.avatar_url]);

  useEffect(() => {
    return () => {
      if (pendingPreviewObjectUrlRef.current) {
        URL.revokeObjectURL(pendingPreviewObjectUrlRef.current);
      }
    };
  }, []);

  const fetchUserCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const companies = await companiesApi.getAll({ mine: true, limit: 50 });
      setUserCompanies(Array.isArray(companies) ? companies : []);
    } catch (err) {
      console.error('Error fetching user companies:', err);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar suas empresas.',
        variant: 'destructive',
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchUserReviews = async () => {
    try {
      setLoadingReviews(true);
      const reviews = await reviewsApi.getAll({ mine: true, limit: 50 });
      setUserReviews(Array.isArray(reviews) ? reviews : []);
    } catch (err) {
      console.error('Error fetching user reviews:', err);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar suas avaliações.',
        variant: 'destructive',
      });
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSave = async () => {
    // In a real implementation, you would update the user profile
    // await usersApi.update(user.id, editedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  const handleAvatarFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!selectedFile) return;

    setAvatarError(null);
    setAvatarUploadProgress(0);

    try {
      const preparedFile = await prepareAvatarFileForUpload(selectedFile);

      if (pendingPreviewObjectUrlRef.current) {
        URL.revokeObjectURL(pendingPreviewObjectUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(preparedFile);
      pendingPreviewObjectUrlRef.current = objectUrl;
      setPendingAvatarPreviewUrl(objectUrl);
      setPendingAvatarFile(preparedFile);
    } catch (uploadError) {
      const message =
        uploadError instanceof AvatarUploadClientError
          ? uploadError.message
          : getApiErrorMessage(uploadError, 'Falha ao preparar a imagem.');
      setAvatarError(message);
      toast({
        title: 'Falha ao selecionar foto',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleAvatarUpload = async () => {
    if (!user || !pendingAvatarFile || avatarUploading) return;

    setAvatarUploading(true);
    setAvatarUploadProgress(0);
    setAvatarError(null);

    try {
      const uploadResult = await uploadUserAvatar(user.id, pendingAvatarFile, {
        retries: 2,
        timeoutMs: 60_000,
        onProgress: (progress) => setAvatarUploadProgress(progress.percent),
      });

      if (uploadResult.avatarUrl) {
        setAvatarDisplayUrl(uploadResult.avatarUrl);
        setUploadedAvatarUrl(uploadResult.avatarUrl);
      }

      await refreshAuth();
      resetPendingAvatarState();
      toast({
        title: 'Foto atualizada com sucesso',
        description: uploadResult.avatarUrl
          ? 'A nova foto de perfil já está disponível.'
          : 'Upload concluído.',
      });
    } catch (uploadError: unknown) {
      const networkFailure =
        typeof uploadError === 'object' &&
        uploadError !== null &&
        'isNetworkError' in uploadError &&
        Boolean(uploadError.isNetworkError);
      const detailedMessage = networkFailure
        ? 'Falha de rede durante o upload. Verifique sua conexão e tente novamente.'
        : getApiErrorMessage(uploadError, 'Não foi possível enviar a foto de perfil.');
      setAvatarError(detailedMessage);
      toast({
        title: 'Erro no upload da foto',
        description: detailedMessage,
        variant: 'destructive',
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Erro ao carregar perfil</h3>
              <p className="text-gray-600 mb-4">
                Não foi possível carregar as informações do seu perfil. Por favor, tente novamente.
              </p>
              <Button onClick={() => router.push('/')}>Voltar para página inicial</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Meu Perfil</h1>
              <p className="text-muted-foreground">
                Gerencie suas informações de perfil e preferências
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <Button variant="outline" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="compare">Comparar</TabsTrigger>
              <TabsTrigger value="companies">Minhas Empresas</TabsTrigger>
              <TabsTrigger value="reviews">Minhas Avaliações</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Gerencie suas informações de perfil e preferências
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage
                        src={pendingAvatarPreviewUrl || avatarDisplayUrl || undefined}
                        alt={user.name}
                      />
                      <AvatarFallback className="text-2xl">
                        {user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      id="avatar-upload-input"
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={handleAvatarFileSelect}
                      aria-label="Selecionar imagem de perfil"
                    />
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={avatarUploading}
                      >
                        Alterar Foto
                      </Button>
                      {pendingAvatarFile && (
                        <>
                          <Button size="sm" onClick={handleAvatarUpload} disabled={avatarUploading}>
                            {avatarUploading ? 'Enviando...' : 'Salvar Foto'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetPendingAvatarState}
                            disabled={avatarUploading}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Formatos aceitos: JPG e PNG. Tamanho máximo: 5MB.
                    </p>

                    {avatarUploading && (
                      <div className="w-full max-w-sm space-y-2">
                        <Progress value={avatarUploadProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-center">
                          Enviando foto... {avatarUploadProgress}%
                        </p>
                      </div>
                    )}

                    {avatarError && (
                      <p className="text-sm text-red-600 text-center">{avatarError}</p>
                    )}

                    {uploadedAvatarUrl && !pendingAvatarFile && (
                      <div className="w-full max-w-sm rounded-md border border-border px-3 py-2 text-xs">
                        <span className="font-medium text-foreground">URL pública: </span>
                        <a
                          href={uploadedAvatarUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-primary underline"
                        >
                          {uploadedAvatarUrl}
                        </a>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome</Label>
                        <Input
                          id="name"
                          value={editedUser.name}
                          onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editedUser.email}
                          onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={editedUser.phone}
                          onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <UserIcon className="h-5 w-5 text-muted-foreground mr-3" />
                        <span>{user.name}</span>
                      </div>

                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-muted-foreground mr-3" />
                        <span>{user.email}</span>
                      </div>

                      {user.phone && (
                        <div className="flex items-center">
                          <Phone className="h-5 w-5 text-muted-foreground mr-3" />
                          <span>{user.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-muted-foreground mr-3" />
                        <span>Membro desde {new Date(user.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end space-x-3">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Perfil
                    </Button>
                  )}
                </CardFooter>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Empresas Cadastradas</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">Empresas registradas</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avaliações Feitas</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">Avaliações registradas</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Comentários</CardTitle>
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">Comentários feitos</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="compare" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Minhas Comparações</CardTitle>
                    <CardDescription>
                      Compare empresas salvas para decidir com mais segurança.
                    </CardDescription>
                  </div>
                  {comparisonList.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearComparison}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Limpar
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {comparisonList.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid gap-3">
                        {comparisonList.map((company) => (
                          <div
                            key={company.id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-foreground">
                                {company.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {[company.city, company.state].filter(Boolean).join(', ') ||
                                  'Localização não informada'}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromComparison(company.id)}
                            >
                              Remover
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button className="w-full" onClick={() => router.push('/compare')}>
                        <Scale className="mr-2 h-4 w-4" />
                        Abrir comparação completa
                      </Button>
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Scale className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold">Nenhuma empresa para comparar</h3>
                      <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
                        Abra uma empresa e adicione à comparação quando quiser analisar opções lado
                        a lado.
                      </p>
                      <Button onClick={() => router.push('/companies')}>Ver empresas</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="companies" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Minhas Empresas</CardTitle>
                  <CardDescription>
                    Gerencie as empresas que você cadastrou na plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCompanies ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-80 rounded-2xl" />
                      ))}
                    </div>
                  ) : userCompanies.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userCompanies.map((company) => (
                        <CompanyCard key={company.id} company={company} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Nenhuma empresa cadastrada</h3>
                      <p className="text-muted-foreground mb-6">
                        Você ainda não cadastrou nenhuma empresa na plataforma.
                      </p>
                      <Button>Cadastrar Empresa</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Minhas Avaliações</CardTitle>
                  <CardDescription>
                    Veja todas as avaliações que você deixou para empresas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingReviews ? (
                    <div className="space-y-6">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-48 rounded-2xl" />
                      ))}
                    </div>
                  ) : userReviews.length > 0 ? (
                    <div className="space-y-6">
                      {userReviews.map((review) => (
                        <ReviewCard key={review.id} review={review} variant="company" />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação feita</h3>
                      <p className="text-muted-foreground mb-6">
                        Você ainda não deixou nenhuma avaliação para empresas.
                      </p>
                      <Button onClick={() => router.push('/companies')}>Ver Empresas</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
