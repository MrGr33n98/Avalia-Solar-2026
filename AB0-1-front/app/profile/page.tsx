'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit, 
  Save, 
  X, 
  Star, 
  MessageCircle, 
  Building, 
  CreditCard 
} from 'lucide-react';
import { companiesApi, reviewsApi, Company, Review } from '@/lib/api';
import CompanyCard from '@/components/CompanyCard';
import ReviewCard from '@/components/ReviewCard';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ name: '', email: '', phone: '' });
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  
  const { user, loading, error, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setEditedUser({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      
      // Fetch user's companies and reviews
      fetchUserCompanies();
      fetchUserReviews();
    }
  }, [user]);

  const fetchUserCompanies = async () => {
    try {
      setLoadingCompanies(true);
      // In a real implementation, you would fetch companies associated with this user
      // const companies = await companiesApi.getByUserId(user.id);
      // setUserCompanies(companies);
    } catch (err) {
      console.error('Error fetching user companies:', err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchUserReviews = async () => {
    try {
      setLoadingReviews(true);
      // In a real implementation, you would fetch reviews associated with this user
      // const reviews = await reviewsApi.getByUserId(user.id);
      // setUserReviews(reviews);
    } catch (err) {
      console.error('Error fetching user reviews:', err);
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
      phone: user?.phone || ''
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
              <Button onClick={() => router.push('/')}>
                Voltar para página inicial
              </Button>
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
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
                      <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                      <AvatarFallback className="text-2xl">
                        {user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">
                      Alterar Foto
                    </Button>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome</Label>
                        <Input
                          id="name"
                          value={editedUser.name}
                          onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editedUser.email}
                          onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={editedUser.phone}
                          onChange={(e) => setEditedUser({...editedUser, phone: e.target.value})}
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
                    <CardTitle className="text-sm font-medium">
                      Empresas Cadastradas
                    </CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Empresas registradas
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Avaliações Feitas
                    </CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Avaliações registradas
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Comentários
                    </CardTitle>
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Comentários feitos
                    </p>
                  </CardContent>
                </Card>
              </div>
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
                        <ReviewCard key={review.id} review={review} />
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
                      <Button onClick={() => router.push('/companies')}>
                        Ver Empresas
                      </Button>
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