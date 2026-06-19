'use client';

import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
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
  Leaf,
  LogOut,
  MapPin,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { companiesApi, reviewsApi, usersApi, Company, Review } from '@/lib/api';
import CompanyCard from '@/components/CompanyCard';
import ReviewCard from '@/components/ReviewCard';
import { useComparison } from '@/hooks/useComparison';
import {
  AvatarUploadClientError,
  prepareAvatarFileForUpload,
  uploadUserAvatar,
} from '@/lib/avatar-upload';
import { getApiErrorMessage } from '@/lib/api-error';

function initialsFromName(name?: string | null) {
  const safeName = name?.trim() || 'Usuário';
  return safeName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatProfileDate(value?: string) {
  if (!value) return 'Hoje';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Hoje';
  return date.toLocaleDateString('pt-BR');
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ name: '', email: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
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
    if (!user || savingProfile) return;

    setSavingProfile(true);
    try {
      await usersApi.update(user.id, {
        name: editedUser.name,
        email: editedUser.email,
        phone: editedUser.phone,
      });
      await refreshAuth();
      setIsEditing(false);
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.',
      });
    } catch (saveError) {
      toast({
        title: 'Erro ao salvar perfil',
        description: getApiErrorMessage(saveError, 'Não foi possível atualizar seus dados.'),
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
    }
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
      <div className="min-h-screen bg-[#f4faf7]">
        <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <Skeleton className="h-16 w-full rounded-[20px]" />
          <Skeleton className="h-48 w-full rounded-[24px]" />
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-28 rounded-[20px]" />
            <Skeleton className="h-28 rounded-[20px]" />
            <Skeleton className="h-28 rounded-[20px]" />
            <Skeleton className="h-28 rounded-[20px]" />
          </div>
          <Skeleton className="h-96 w-full rounded-[20px]" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[#f4faf7] px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Card className="rounded-[20px] border-red-100 bg-white shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <UserIcon className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-950">Erro ao carregar perfil</h3>
              <p className="mb-4 text-slate-600">
                Não foi possível carregar as informações do seu perfil. Por favor, tente novamente.
              </p>
              <Button className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700" onClick={() => router.push('/')}>
                Voltar para página inicial
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const avatarSource = pendingAvatarPreviewUrl || avatarDisplayUrl || undefined;
  const userInitials = initialsFromName(user.name);
  const memberSince = formatProfileDate(user.created_at);
  const location = [user.city, user.state].filter(Boolean).join(', ') || 'Brasil';
  const reviewsCount = userReviews.length;
  const companiesCount = userCompanies.length;
  const commentsCount = userReviews.filter((review) => review.comment || review.body).length;
  const helpfulVotes = userReviews.reduce((total, review) => total + Number(review.helpful_count || 0), 0);
  const greenScore = Math.min(999, 520 + reviewsCount * 35 + helpfulVotes * 2);
  const impactedPeople = Math.max(0, reviewsCount * 82 + companiesCount * 24);
  const profileCompletion = Math.min(
    100,
    42 +
      (user.name ? 14 : 0) +
      (user.email ? 14 : 0) +
      (user.phone ? 10 : 0) +
      (avatarDisplayUrl ? 10 : 0) +
      ((user.city || user.state) ? 10 : 0)
  );
  const reputationLevel =
    greenScore >= 760 ? 'Eco Expert' : greenScore >= 650 ? 'Green Pro' : 'Em evolução';
  const dashboardHref = user.role === 'review' ? '/review-dashboard' : '/dashboard';

  const statCards = [
    {
      label: 'Green Score',
      value: greenScore,
      helper: reputationLevel,
      icon: Leaf,
      className: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Avaliações',
      value: reviewsCount,
      helper: 'registradas',
      icon: Star,
      className: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Votos úteis',
      value: helpfulVotes,
      helper: 'recebidos',
      icon: Trophy,
      className: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Impactados',
      value: impactedPeople,
      helper: 'pessoas',
      icon: Users,
      className: 'bg-rose-50 text-rose-700',
    },
    {
      label: 'Comentários',
      value: commentsCount,
      helper: 'feitos',
      icon: MessageCircle,
      className: 'bg-violet-50 text-violet-700',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4faf7] text-slate-950">
      <header className="border-b border-emerald-100/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Avalia Solar
              </p>
              <h1 className="truncate text-2xl font-black text-slate-950 md:text-3xl">
                Meu Perfil
              </h1>
              <p className="truncate text-sm font-semibold text-slate-600">
                Sua identidade dentro da Central de Reputação Sustentável.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-xl border-emerald-200 bg-white font-bold text-emerald-800 hover:bg-emerald-50"
              onClick={() => router.push(dashboardHref)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Central
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-red-100 bg-white font-bold text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 pb-24 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#0A2C33,#0F5B53_56%,#114D43)] p-5 text-white shadow-sm md:p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-col gap-5 md:flex-row md:items-center">
              <div className="relative w-fit shrink-0">
                <Avatar className="h-28 w-28 border-4 border-white/25 bg-white/10">
                  <AvatarImage src={avatarSource} alt={user.name} />
                  <AvatarFallback className="bg-white text-3xl font-black text-emerald-900">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full border-2 border-[#0f5b53] bg-amber-400 text-slate-950 shadow-sm hover:bg-amber-300"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  aria-label="Alterar foto de perfil"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              <div className="min-w-0 space-y-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-3xl font-black">{user.name}</h2>
                    <CheckCircle2 className="h-5 w-5 fill-emerald-400 text-emerald-400" />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-white/78">
                    {user.role === 'review' ? 'Especialista Solar' : 'Perfil Avalia Solar'} · Membro desde {memberSince}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-white/78">
                    <MapPin className="h-4 w-4" />
                    {location}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['Solar Expert', 'Green House', reputationLevel, 'Top Avaliador'].map((badge) => (
                    <Badge key={badge} className="rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/15">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-5 xl:min-w-[640px]">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <Icon className="mb-3 h-5 w-5 text-amber-200" />
                    <p className="text-2xl font-black">{stat.value}</p>
                    <p className="text-xs font-bold text-white/72">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-5">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="h-[116px] rounded-[20px] border-slate-200 bg-white shadow-sm">
                <CardContent className="flex h-full items-center gap-4 p-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${stat.className}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                      {stat.label}
                    </p>
                    <span className="text-3xl font-black text-slate-950">{stat.value}</span>
                    <p className="truncate text-xs font-bold text-emerald-700">{stat.helper}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-[20px] border border-emerald-100 bg-white p-2 shadow-sm md:grid-cols-4">
            <TabsTrigger value="profile" className="rounded-2xl py-3 text-sm font-bold data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-800 data-[state=active]:shadow-none">
              Perfil
            </TabsTrigger>
            <TabsTrigger value="compare" className="rounded-2xl py-3 text-sm font-bold data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-800 data-[state=active]:shadow-none">
              Comparar
            </TabsTrigger>
            <TabsTrigger value="companies" className="rounded-2xl py-3 text-sm font-bold data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-800 data-[state=active]:shadow-none">
              Minhas Empresas
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-2xl py-3 text-sm font-bold data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-800 data-[state=active]:shadow-none">
              Minhas Avaliações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-12">
              <Card className="rounded-[20px] border-slate-200 bg-white shadow-sm xl:col-span-8">
                <CardHeader className="flex flex-col gap-3 border-b border-slate-100 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl font-black text-slate-950">Informações pessoais</CardTitle>
                    <CardDescription className="font-semibold text-slate-500">
                      Dados usados para sua reputação, login e contato.
                    </CardDescription>
                  </div>
                  {!isEditing && (
                    <Button
                      className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Perfil
                    </Button>
                  )}
                </CardHeader>

                <CardContent className="space-y-6 p-5">
                  {isEditing ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="font-bold text-slate-700">Nome</Label>
                        <Input
                          id="name"
                          value={editedUser.name}
                          onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                          className="h-11 rounded-xl border-slate-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="font-bold text-slate-700">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editedUser.email}
                          onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                          className="h-11 rounded-xl border-slate-200"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="phone" className="font-bold text-slate-700">Telefone</Label>
                        <Input
                          id="phone"
                          value={editedUser.phone}
                          onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                          className="h-11 rounded-xl border-slate-200"
                        />
                      </div>

                      <div className="flex flex-wrap justify-end gap-3 md:col-span-2">
                        <Button
                          variant="outline"
                          className="rounded-xl border-slate-200 font-bold"
                          onClick={handleCancel}
                          disabled={savingProfile}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                        <Button
                          className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700"
                          onClick={handleSave}
                          disabled={savingProfile}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {savingProfile ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {[
                        { icon: UserIcon, label: 'Nome', value: user.name },
                        { icon: Mail, label: 'Email', value: user.email },
                        { icon: Phone, label: 'Telefone', value: user.phone || 'Não informado' },
                        { icon: Calendar, label: 'Membro desde', value: memberSince },
                        { icon: MapPin, label: 'Localização', value: location },
                        { icon: ShieldCheck, label: 'Nível', value: reputationLevel },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                                {item.label}
                              </p>
                              <p className="truncate text-sm font-bold text-slate-950">{item.value}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[20px] border-emerald-100 bg-white shadow-sm xl:col-span-4">
                <CardHeader>
                  <CardTitle className="text-xl font-black text-slate-950">Foto e reputação</CardTitle>
                  <CardDescription className="font-semibold text-slate-500">
                    Uma foto real aumenta confiança nas avaliações.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <input
                    id="avatar-upload-input"
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleAvatarFileSelect}
                    aria-label="Selecionar imagem de perfil"
                  />

                  <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-emerald-200 bg-emerald-50/50 p-5 text-center">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
                      <AvatarImage src={avatarSource} alt={user.name} />
                      <AvatarFallback className="bg-white text-2xl font-black text-emerald-900">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-black text-slate-950">Imagem do perfil</p>
                      <p className="text-xs font-semibold text-slate-500">
                        JPG ou PNG até 5MB.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-emerald-200 bg-white font-bold text-emerald-800 hover:bg-emerald-50"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={avatarUploading}
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Alterar Foto
                      </Button>
                      {pendingAvatarFile && (
                        <>
                          <Button
                            size="sm"
                            className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700"
                            onClick={handleAvatarUpload}
                            disabled={avatarUploading}
                          >
                            {avatarUploading ? 'Enviando...' : 'Salvar Foto'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl font-bold"
                            onClick={resetPendingAvatarState}
                            disabled={avatarUploading}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {avatarUploading && (
                    <div className="space-y-2">
                      <Progress value={avatarUploadProgress} className="h-2 bg-slate-100" />
                      <p className="text-center text-xs font-semibold text-slate-500">
                        Enviando foto... {avatarUploadProgress}%
                      </p>
                    </div>
                  )}

                  {avatarError && (
                    <p className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
                      {avatarError}
                    </p>
                  )}

                  {uploadedAvatarUrl && !pendingAvatarFile && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs">
                      <span className="font-black text-emerald-900">URL pública: </span>
                      <a
                        href={uploadedAvatarUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all font-semibold text-emerald-800 underline"
                      >
                        {uploadedAvatarUrl}
                      </a>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-slate-950">Perfil completo</p>
                      <Badge className="rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        {profileCompletion}%
                      </Badge>
                    </div>
                    <Progress value={profileCompletion} className="h-2 bg-slate-100" />
                    <p className="text-xs font-semibold text-slate-500">
                      Complete foto, telefone e localização para fortalecer sua reputação.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="compare" className="space-y-6">
            <Card className="rounded-[20px] border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex flex-col gap-3 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-slate-950">Minhas comparações</CardTitle>
                  <CardDescription className="font-semibold text-slate-500">
                    Compare empresas salvas para decidir com mais segurança.
                  </CardDescription>
                </div>
                {comparisonList.length > 0 && (
                  <Button variant="outline" size="sm" className="rounded-xl border-slate-200 font-bold" onClick={clearComparison}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpar
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-5">
                {comparisonList.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      {comparisonList.map((company) => (
                        <div
                          key={company.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-950">
                              {company.name}
                            </p>
                            <p className="text-xs font-semibold text-slate-500">
                              {[company.city, company.state].filter(Boolean).join(', ') ||
                                'Localização não informada'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl font-bold"
                            onClick={() => removeFromComparison(company.id)}
                          >
                            Remover
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700" onClick={() => router.push('/compare')}>
                      <Scale className="mr-2 h-4 w-4" />
                      Abrir comparação completa
                    </Button>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <Scale className="h-8 w-8" />
                    </div>
                    <h3 className="mb-2 text-lg font-black text-slate-950">Nenhuma empresa para comparar</h3>
                    <p className="mx-auto mb-6 max-w-sm text-sm font-semibold text-slate-500">
                      Abra uma empresa e adicione à comparação quando quiser analisar opções lado a lado.
                    </p>
                    <Button className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700" onClick={() => router.push('/companies')}>
                      Ver empresas
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="companies" className="space-y-6">
            <Card className="rounded-[20px] border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-xl font-black text-slate-950">Minhas empresas</CardTitle>
                <CardDescription className="font-semibold text-slate-500">
                  Empresas vinculadas ou cadastradas por você.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                {loadingCompanies ? (
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {[...Array(3)].map((_, index) => (
                      <Skeleton key={index} className="h-80 rounded-2xl" />
                    ))}
                  </div>
                ) : userCompanies.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {userCompanies.map((company) => (
                      <CompanyCard key={company.id} company={company} />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <Building className="h-8 w-8" />
                    </div>
                    <h3 className="mb-2 text-lg font-black text-slate-950">Nenhuma empresa cadastrada</h3>
                    <p className="mb-6 text-sm font-semibold text-slate-500">
                      Você ainda não cadastrou nenhuma empresa na plataforma.
                    </p>
                    <Button className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700" onClick={() => router.push('/companies')}>
                      Explorar empresas
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card className="rounded-[20px] border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-xl font-black text-slate-950">Minhas avaliações</CardTitle>
                <CardDescription className="font-semibold text-slate-500">
                  Sua contribuição para o ecossistema Avalia Solar.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                {loadingReviews ? (
                  <div className="space-y-6">
                    {[...Array(3)].map((_, index) => (
                      <Skeleton key={index} className="h-48 rounded-2xl" />
                    ))}
                  </div>
                ) : userReviews.length > 0 ? (
                  <div className="space-y-6">
                    {userReviews.map((review) => (
                      <ReviewCard key={review.id} review={review} variant="company" />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                      <Star className="h-8 w-8" />
                    </div>
                    <h3 className="mb-2 text-lg font-black text-slate-950">Nenhuma avaliação feita</h3>
                    <p className="mb-6 text-sm font-semibold text-slate-500">
                      Você ainda não deixou nenhuma avaliação para empresas.
                    </p>
                    <Button className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700" onClick={() => router.push('/companies')}>
                      Ver empresas
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
