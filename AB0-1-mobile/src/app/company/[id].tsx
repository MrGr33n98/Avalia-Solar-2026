import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useColorScheme,
  Linking,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  Phone,
  Mail,
  Globe,
  MapPin,
  ClipboardList,
  MessageSquare,
  Send,
  Sun,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { companiesApi, reviewsApi, Company, Review } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useTracking } from '@/hooks/useTracking';

export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { trackLeadSent } = useTracking();
  const canUseP2PChat = user?.role === 'review';

  // Estado para novo review
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Buscar dados da empresa por ID
  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company-detail', id],
    queryFn: () => companiesApi.getByIdOrSlug(id),
    enabled: !!id,
  });

  // Buscar reviews da empresa
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ['company-reviews', id],
    queryFn: () => (id ? reviewsApi.getByCompany(Number(id)) : Promise.resolve([])),
    enabled: !!id,
  });

  // Mutação para enviar novo review
  const createReviewMutation = useMutation({
    mutationFn: (data: { rating: number; title: string; comment: string; reviewer_name: string }) =>
      reviewsApi.create({
        company_id: Number(id),
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        reviewer_name: data.reviewer_name,
      }),
    onSuccess: () => {
      // Invalidar cache para recarregar reviews e nota da empresa
      queryClient.invalidateQueries({ queryKey: ['company-reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
      Alert.alert('Sucesso', 'Sua avaliação foi enviada com sucesso!');
      setNewComment('');
      setNewTitle('');
      setShowReviewForm(false);
    },
    onError: (err: any) => {
      Alert.alert('Erro', err.message || 'Falha ao enviar avaliação. Tente novamente.');
    },
  });

  const handleCreateReview = () => {
    if (!newComment.trim()) {
      Alert.alert('Erro', 'Por favor, escreva um comentário para sua avaliação.');
      return;
    }
    createReviewMutation.mutate({
      rating: newRating,
      title: newTitle,
      comment: newComment,
      reviewer_name: user?.name || 'Cliente Anônimo',
    });
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Erro ao abrir link:', err));
  };

  if (isLoadingCompany) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
        <ThemedText style={{ marginTop: Spacing.three }}>Carregando dados da empresa...</ThemedText>
      </ThemedView>
    );
  }

  if (!company) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText type="subtitle">Empresa não encontrada</ThemedText>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ThemedText style={styles.backBtnText}>Voltar</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Cover / Header Image */}
        <View style={styles.coverContainer}>
          {company.cover_url ? (
            <Image source={{ uri: company.cover_url }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: colors.tint }]}>
              <Sun color={colors.backgroundElement} size={48} />
            </View>
          )}
          
          <TouchableOpacity style={styles.iconBack} onPress={() => router.back()}>
            <ArrowLeft color={colors.backgroundElement} size={24} />
          </TouchableOpacity>
        </View>

        {/* Informações Principais */}
        <View style={styles.profileSection}>
          <View style={styles.logoAndTitleRow}>
            {company.logo_url ? (
              <Image source={{ uri: company.logo_url }} style={styles.logoImage} />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: colors.backgroundSelected }]}>
                <ThemedText style={styles.placeholderLetter}>{company.name[0]}</ThemedText>
              </View>
            )}

            <View style={styles.titleInfo}>
              <View style={styles.nameRow}>
                <ThemedText type="subtitle" style={styles.companyName}>
                  {company.name}
                </ThemedText>
                {company.verified && (
                  <ShieldCheck size={18} color={colors.success} style={{ marginLeft: 6 }} />
                )}
              </View>
              
              <View style={styles.ratingRow}>
                <Star size={14} color={colors.starYellow} fill={colors.starYellow} />
                <ThemedText style={styles.ratingText}>
                  {company.rating ? company.rating.toFixed(1) : '5.0'}
                </ThemedText>
                <ThemedText style={styles.reviewCountText}>
                  ({company.review_count || 0} avaliações)
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Localização */}
          <View style={styles.locationContainer}>
            <MapPin size={14} color={colors.textSecondary} />
            <ThemedText style={styles.locationText} themeColor="textSecondary">
              {company.address ? `${company.address}, ` : ''}{company.city} - {company.state}
            </ThemedText>
          </View>
        </View>

        {/* CTA Solicitar Orçamento: somente entitlement pago */}
        {company.has_paid_plan === true && <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: colors.tint }]}
            onPress={() => router.push(`/company/${company.id}/lead`)}
          >
            <ClipboardList size={18} color={colors.backgroundElement} />
            <ThemedText style={styles.ctaButtonText}>Solicitar Orçamento Grátis</ThemedText>
          </TouchableOpacity>
        </View>}

        {/* Descrição / Sobre */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Sobre a Empresa</ThemedText>
          <ThemedText style={styles.descriptionText} themeColor="textSecondary">
            {company.description || 'Esta empresa parceira do Avalia Solar ainda não adicionou uma descrição detalhada de seus serviços. Entre em contato para saber mais sobre seus projetos e instalações.'}
          </ThemedText>
        </View>

        {/* Seção de Serviços Rápidos */}
        <View style={styles.section}>
          <View style={styles.servicesHeaderRow}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Serviços</ThemedText>
            <TouchableOpacity onPress={() => router.push(`/company/${company.id}/services`)}>
              <ThemedText style={styles.viewServicesLink}>Ver Detalhes</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.servicesGrid}>
            {['On-Grid', 'Off-Grid', 'Manutenção', 'Limpeza'].map((service, idx) => (
              <View key={idx} style={[styles.serviceChip, { backgroundColor: colors.backgroundElement }]}>
                <ThemedText style={styles.serviceChipText}>{service}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Canais de Contato */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Canais de Contato</ThemedText>
          
          <View style={styles.contactList}>
            {company.p2p_chat_enabled && canUseP2PChat && (
              <TouchableOpacity
                style={[styles.contactItem, { backgroundColor: '#F97316' }]}
                onPress={() => router.push(`/p2p_chat?company_id=${company.id}`)}
              >
                <MessageSquare size={16} color={colors.backgroundElement} />
                <ThemedText style={[styles.contactItemText, { color: colors.backgroundElement, fontWeight: 'bold' }]}>
                  Chat Direto (OLX Style)
                </ThemedText>
              </TouchableOpacity>
            )}

            {company.phone && (
              <TouchableOpacity
                style={[styles.contactItem, { backgroundColor: colors.backgroundElement }]}
                onPress={() => {
                  trackLeadSent(company.id, 'whatsapp');
                  openLink(`tel:${company.phone}`);
                }}
              >
                <Phone size={16} color={colors.tint} />
                <ThemedText style={styles.contactItemText}>{company.phone}</ThemedText>
              </TouchableOpacity>
            )}

            {company.email && (
              <TouchableOpacity
                style={[styles.contactItem, { backgroundColor: colors.backgroundElement }]}
                onPress={() => openLink(`mailto:${company.email}`)}
              >
                <Mail size={16} color={colors.tint} />
                <ThemedText style={styles.contactItemText}>{company.email}</ThemedText>
              </TouchableOpacity>
            )}

            {company.website && (
              <TouchableOpacity
                style={[styles.contactItem, { backgroundColor: colors.backgroundElement }]}
                onPress={() => openLink(company.website!.startsWith('http') ? company.website! : `https://${company.website}`)}
              >
                <Globe size={16} color={colors.tint} />
                <ThemedText style={styles.contactItemText}>{company.website}</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Seção de Avaliações (Reviews) */}
        <View style={[styles.section, { marginBottom: Spacing.six }]}>
          <View style={styles.reviewsHeaderRow}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Avaliações</ThemedText>
            <TouchableOpacity onPress={() => setShowReviewForm(!showReviewForm)}>
              <ThemedText style={styles.addReviewLink}>Avaliar Empresa</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Form para adicionar nova avaliação */}
          {showReviewForm && (
            <View style={[styles.reviewForm, { backgroundColor: colors.backgroundElement }]}>
              <ThemedText style={styles.formLabel}>Sua nota para a empresa:</ThemedText>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setNewRating(star)}>
                    <Star
                      size={28}
                      color={colors.starYellow}
                      fill={star <= newRating ? colors.starYellow : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                placeholder="Título da avaliação (ex: Excelente serviço!)"
                placeholderTextColor={colors.textSecondary}
                style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <TextInput
                placeholder="Escreva seu comentário detalhado sobre a empresa..."
                placeholderTextColor={colors.textSecondary}
                style={[styles.formTextarea, { color: colors.text, borderColor: colors.backgroundSelected }]}
                multiline
                numberOfLines={4}
                value={newComment}
                onChangeText={setNewComment}
              />

              <TouchableOpacity
                style={[styles.submitReviewBtn, { backgroundColor: colors.tint }]}
                onPress={handleCreateReview}
                disabled={createReviewMutation.isPending}
              >
                {createReviewMutation.isPending ? (
                  <ActivityIndicator color={colors.backgroundElement} />
                ) : (
                  <>
                    <Send size={14} color={colors.backgroundElement} />
                    <ThemedText style={styles.submitReviewBtnText}>Enviar Avaliação</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Listagem de Reviews */}
          {isLoadingReviews ? (
            <ActivityIndicator color={colors.tint} />
          ) : reviews.length === 0 ? (
            <ThemedText style={styles.emptyReviewsText} themeColor="textSecondary">
              Nenhuma avaliação para esta empresa ainda. Seja o primeiro a avaliar!
            </ThemedText>
          ) : (
            <View style={styles.reviewsList}>
              {reviews.slice(0, 3).map((review: Review) => (
                <View key={review.id} style={[styles.reviewCard, { borderBottomColor: colors.backgroundElement }]}>
                  <View style={styles.reviewHeader}>
                    <ThemedText style={styles.reviewerName}>{review.reviewer_name}</ThemedText>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          color={colors.starYellow}
                          fill={s <= review.rating ? colors.starYellow : 'transparent'}
                        />
                      ))}
                    </View>
                  </View>
                  {review.title ? (
                    <ThemedText style={styles.reviewTitle}>{review.title}</ThemedText>
                  ) : null}
                  {review.comment ? (
                    <ThemedText style={styles.reviewComment} themeColor="textSecondary">
                      {review.comment}
                    </ThemedText>
                  ) : null}
                  <ThemedText style={styles.reviewDate} themeColor="textSecondary">
                    {review.created_at}
                  </ThemedText>
                </View>
              ))}
              
              {reviews.length > 3 && (
                <TouchableOpacity
                  style={[styles.viewAllReviewsBtn, { backgroundColor: colors.backgroundElement }]}
                  onPress={() => router.push(`/company/${company.id}/reviews`)}
                >
                  <ThemedText style={styles.viewAllReviewsText}>Ver todas as {reviews.length} avaliações</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  backBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: colors.tint,
  },
  backBtnText: {
    color: colors.backgroundElement,
    fontWeight: 'bold',
  },
  coverContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBack: {
    position: 'absolute',
    top: 40,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    paddingHorizontal: Spacing.four,
    marginTop: -30,
    marginBottom: Spacing.three,
  },
  logoAndTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.three,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: Spacing.two,
    borderWidth: 3,
    borderColor: colors.backgroundElement,
    backgroundColor: colors.backgroundElement,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: Spacing.two,
    borderWidth: 3,
    borderColor: colors.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderLetter: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.tint,
  },
  titleInfo: {
    flex: 1,
    paddingBottom: Spacing.one,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  reviewCountText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.three,
  },
  locationText: {
    fontSize: 13,
  },
  ctaContainer: {
    paddingHorizontal: Spacing.four,
    marginVertical: Spacing.two,
  },
  ctaButton: {
    height: 50,
    borderRadius: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  ctaButtonText: {
    color: colors.backgroundElement,
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: Spacing.four,
    marginVertical: Spacing.three,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactList: {
    gap: Spacing.two,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.three,
  },
  contactItemText: {
    fontSize: 13,
    fontWeight: '500',
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  addReviewLink: {
    color: colors.tint,
    fontSize: 13,
    fontWeight: 'bold',
  },
  reviewForm: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  formInput: {
    height: 40,
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 13,
  },
  formTextarea: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    padding: Spacing.three,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  submitReviewBtn: {
    height: 40,
    borderRadius: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.one,
  },
  submitReviewBtnText: {
    color: colors.backgroundElement,
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyReviewsText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: Spacing.two,
  },
  reviewsList: {
    gap: Spacing.three,
  },
  reviewCard: {
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 18,
  },
  reviewDate: {
    fontSize: 10,
    marginTop: Spacing.two,
  },
  servicesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  viewServicesLink: {
    color: colors.tint,
    fontSize: 13,
    fontWeight: 'bold',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  serviceChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  serviceChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewAllReviewsBtn: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  viewAllReviewsText: {
    color: colors.tint,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
