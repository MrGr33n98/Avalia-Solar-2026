import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useColorScheme,
  Linking,
  Alert,
  Platform,
  Vibration,
  Animated,
  Dimensions,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  MessageSquare,
  Send,
  Sun,
  Award,
  ExternalLink,
  Bookmark,
  Share2,
  ChevronRight,
  Building2,
  Package,
  UserCheck,
  Calendar,
  Truck,
  TextIcon,
} from 'lucide-react-native';
import { TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { companiesApi, reviewsApi, Company, Review } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useTracking } from '@/hooks/useTracking';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Banner height 3:1 ratio compacto
const BANNER_HEIGHT = Math.round(SCREEN_WIDTH / 3);
// Logo flutuante
const LOGO_SIZE = 56;
const LOGO_OFFSET = LOGO_SIZE / 2;

// ─── Haptic helper ────────────────────────────────────────────────────────────
function haptic() {
  if (Platform.OS !== 'web') {
    try {
      Vibration.vibrate(10);
    } catch (_) {
      // silently ignore
    }
  }
}

// ─── Link externo com confirmação ─────────────────────────────────────────────
function openExternalLink(url: string, label?: string) {
  const target = url.startsWith('http') ? url : `https://${url}`;
  Alert.alert(
    'Abrir link externo',
    `Deseja abrir ${label || target}?`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Abrir',
        onPress: () => Linking.openURL(target).catch(() => {}),
      },
    ]
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview', label: 'Visão Geral', icon: Building2 },
  { key: 'services', label: 'Serviços', icon: Package },
  { key: 'reviews', label: 'Avaliações', icon: Star },
  { key: 'contact', label: 'Contato', icon: Phone },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { trackLeadSent } = useTracking();
  const insets = useSafeAreaInsets();
  const canUseP2PChat = user?.role === 'review';

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [descExpanded, setDescExpanded] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const tabsScrollRef = useRef<ScrollView>(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: company, isLoading } = useQuery({
    queryKey: ['company-detail', id],
    queryFn: () => companiesApi.getByIdOrSlug(id),
    enabled: !!id,
  });

  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ['company-reviews', id],
    queryFn: () => (id ? reviewsApi.getByCompany(Number(id)) : Promise.resolve([])),
    enabled: !!id,
  });

  // ── Mutation ──────────────────────────────────────────────────────────────
  const createReviewMutation = useMutation({
    mutationFn: (data: {
      rating: number;
      title: string;
      comment: string;
      reviewer_name: string;
    }) =>
      reviewsApi.create({
        company_id: Number(id),
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
      Alert.alert('Sucesso', 'Sua avaliação foi enviada!');
      setNewComment('');
      setNewTitle('');
      setShowReviewForm(false);
    },
    onError: (err: any) => {
      Alert.alert('Erro', err.message || 'Falha ao enviar avaliação.');
    },
  });

  const handleCreateReview = () => {
    if (!newComment.trim()) {
      Alert.alert('Erro', 'Por favor, escreva um comentário.');
      return;
    }
    createReviewMutation.mutate({
      rating: newRating,
      title: newTitle,
      comment: newComment,
      reviewer_name: user?.name || 'Cliente Anônimo',
    });
  };

  // ── Tab change ────────────────────────────────────────────────────────────
  const handleTabChange = useCallback((tab: TabKey) => {
    haptic();
    setActiveTab(tab);
  }, []);

  // ─── Loading / Not found ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
        <ThemedText style={{ marginTop: Spacing.three }}>Carregando...</ThemedText>
      </ThemedView>
    );
  }

  if (!company) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText type="subtitle">Empresa não encontrada</ThemedText>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.tint }]} onPress={() => router.back()}>
          <ThemedText style={styles.backBtnText}>Voltar</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const isVerified = company.identity?.verification
    ? company.identity.verification.verified
    : Boolean(company.verified);
  const isPaid = company.commercial_status?.paid ?? company.has_paid_plan ?? false;
  const commercialTier = isPaid
    ? company.commercial_status?.tier?.toUpperCase() || 'PRO'
    : null;
  const recognitions = company.recognitions || company.badges || [];

  const locationLabel = [company.city, company.state].filter(Boolean).join(', ');

  const coverageLabel = (() => {
    const ext = company as any;
    const areas = company.service_areas || [];
    const national = areas.some((a: any) => a.coverage_type === 'national') || ext.coverage_national;
    if (national) return 'Todo o Brasil';
    const states: string[] = Array.isArray(ext.coverage_states) ? ext.coverage_states : [];
    if (states.length > 0) return `Atende ${states.slice(0, 2).join(', ')}`;
    return company.city && company.state ? 'Atuação regional' : null;
  })();

  const desc = company.description || '';
  const SHORT_DESC_LIMIT = 120;
  const descTruncated = !descExpanded && desc.length > SHORT_DESC_LIMIT;
  const displayDesc = descTruncated ? desc.slice(0, SHORT_DESC_LIMIT) + '…' : desc;

  const cleanWebsite = company.website
    ? company.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    : null;

  // ─────────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── ScrollView principal ─────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        // Espaço inferior para não ficar atrás do sticky CTA bar
        contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}
        style={{ flex: 1 }}
      >
        {/* ── BANNER COMPACTO (3:1) ─────────────────────────────────────── */}
        <View style={[styles.bannerContainer, { height: BANNER_HEIGHT }]}>
          {company.cover_url ? (
            <Image source={{ uri: company.cover_url }} style={styles.bannerImage} />
          ) : (
            <View style={[styles.bannerPlaceholder, { backgroundColor: colors.brandActiveBlue }]}>
              <Sun color="#fff" size={40} />
            </View>
          )}

          {/* Gradiente overlay */}
          <View style={styles.bannerGradient} pointerEvents="none" />

          {/* Botão Voltar */}
          <TouchableOpacity
            style={styles.iconBack}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft color="#fff" size={20} />
          </TouchableOpacity>

          {/* Ações secundárias no canto superior direito */}
          <View style={styles.topRightActions}>
            <TouchableOpacity style={styles.iconCircle} onPress={() => haptic()}>
              <Bookmark color="#fff" size={16} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconCircle} onPress={() => haptic()}>
              <Share2 color="#fff" size={16} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── LOGO flutuante ────────────────────────────────────────────── */}
        <View style={[styles.logoWrapper, { top: BANNER_HEIGHT - LOGO_OFFSET }]}>
          {company.logo_url ? (
            <Image
              source={{ uri: company.logo_url }}
              style={[styles.logoImage, { borderColor: colors.backgroundElement }]}
            />
          ) : (
            <View
              style={[
                styles.logoPlaceholder,
                { borderColor: colors.backgroundElement, backgroundColor: colors.tint },
              ]}
            >
              <ThemedText style={styles.logoLetter}>{company.name[0]}</ThemedText>
            </View>
          )}
        </View>

        {/* ── CABEÇALHO INFO ───────────────────────────────────────────── */}
        <View style={[styles.headerInfo, { marginTop: LOGO_OFFSET + 8 }]}>
          {/* Nome + verificado + plano */}
          <View style={styles.nameRow}>
            <ThemedText type="subtitle" style={styles.companyName} numberOfLines={2}>
              {company.name}
            </ThemedText>
            {isVerified && <ShieldCheck size={16} color="#2563EB" style={{ marginLeft: 6 }} />}
            {commercialTier && (
              <View
                style={[
                  styles.planBadge,
                  {
                    backgroundColor:
                      commercialTier === 'ENTERPRISE' ? '#0F172A' : '#EDE9FE',
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.planBadgeText,
                    { color: commercialTier === 'ENTERPRISE' ? '#F8FAFC' : '#6D28D9' },
                  ]}
                >
                  {commercialTier}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Rating inline */}
          <View style={styles.ratingRow}>
            <Star size={13} color={colors.starYellow} fill={colors.starYellow} />
            <ThemedText style={styles.ratingText}>
              {company.rating ? company.rating.toFixed(1) : '5.0'}
            </ThemedText>
            <ThemedText style={[styles.ratingMeta, { color: colors.textSecondary }]}>
              · {company.review_count || 0} avaliações
            </ThemedText>
          </View>

          {/* ── METADADOS EM CHIPS ─────────────────────────────────────── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContent}
          >
            {locationLabel ? (
              <View style={[styles.chip, { backgroundColor: colors.surfaceSubtle }]}>
                <MapPin size={11} color={colors.textSecondary} />
                <ThemedText style={styles.chipText} themeColor="textSecondary">
                  {locationLabel}
                </ThemedText>
              </View>
            ) : null}

            {coverageLabel ? (
              <View style={[styles.chip, { backgroundColor: colors.surfaceSubtle }]}>
                <Truck size={11} color={colors.textSecondary} />
                <ThemedText style={styles.chipText} themeColor="textSecondary">
                  {coverageLabel}
                </ThemedText>
              </View>
            ) : null}

            {company.founded_year ? (
              <View style={[styles.chip, { backgroundColor: colors.surfaceSubtle }]}>
                <Calendar size={11} color={colors.textSecondary} />
                <ThemedText style={styles.chipText} themeColor="textSecondary">
                  Fundada em {company.founded_year}
                </ThemedText>
              </View>
            ) : null}

            {cleanWebsite ? (
              <TouchableOpacity
                style={[styles.chip, { backgroundColor: '#EFF6FF' }]}
                onPress={() =>
                  openExternalLink(company.website!, cleanWebsite)
                }
                activeOpacity={0.7}
              >
                <Globe size={11} color="#2563EB" />
                <ThemedText style={[styles.chipText, { color: '#2563EB', fontWeight: '700' }]}>
                  {cleanWebsite}
                </ThemedText>
                <ExternalLink size={10} color="#2563EB" />
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>

        {/* ── SCROLLABLE TABS ──────────────────────────────────────────── */}
        <View
          style={[
            styles.tabBar,
            { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement },
          ]}
        >
          <ScrollView
            ref={tabsScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarContent}
          >
            {TABS.map(({ key, label, icon: Icon }) => {
              const isActive = activeTab === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={styles.tabItem}
                  onPress={() => handleTabChange(key)}
                  activeOpacity={0.7}
                >
                  <Icon
                    size={15}
                    color={isActive ? colors.tint : colors.textSecondary}
                  />
                  <ThemedText
                    style={[
                      styles.tabLabel,
                      {
                        color: isActive ? colors.tint : colors.textSecondary,
                        fontWeight: isActive ? '700' : '500',
                      },
                    ]}
                  >
                    {label}
                  </ThemedText>
                  {isActive && (
                    <View style={[styles.tabIndicator, { backgroundColor: colors.tint }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── CONTEÚDO DAS TABS ─────────────────────────────────────────── */}
        <View style={styles.tabContent}>
          {/* ── VISÃO GERAL ─────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <View>
              {/* Descrição com "Ler mais" */}
              <View style={[styles.section, { borderBottomColor: colors.border }]}>
                <ThemedText style={styles.sectionTitle}>Sobre a Empresa</ThemedText>
                {desc ? (
                  <>
                    <ThemedText style={styles.descriptionText} themeColor="textSecondary">
                      {displayDesc}
                    </ThemedText>
                    {desc.length > SHORT_DESC_LIMIT && (
                      <TouchableOpacity
                        onPress={() => setDescExpanded((v) => !v)}
                        style={styles.readMoreBtn}
                      >
                        <ThemedText style={[styles.readMoreText, { color: colors.tint }]}>
                          {descExpanded ? 'Ler menos' : 'Ler mais'}
                        </ThemedText>
                        <ChevronRight
                          size={13}
                          color={colors.tint}
                          style={{ transform: [{ rotate: descExpanded ? '-90deg' : '90deg' }] }}
                        />
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <ThemedText style={styles.descriptionText} themeColor="textSecondary">
                    Esta empresa parceira do Avalia Solar ainda não adicionou uma descrição.
                  </ThemedText>
                )}
              </View>

              {/* Selos Oficiais */}
              {recognitions.length > 0 && (
                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                  <View style={styles.sectionRow}>
                    <Award size={16} color={colors.tint} />
                    <ThemedText style={styles.sectionTitle}>Selos Oficiais</ThemedText>
                  </View>
                  <View style={styles.badgesContainer}>
                    {recognitions.map((badge: any, idx: number) => {
                      const verificationUrl =
                        badge.verification_url ||
                        `https://avaliasolar.com.br/badges/${badge.public_slug}`;
                      return (
                        <TouchableOpacity
                          key={`${badge.id || idx}`}
                          style={[
                            styles.badgeCard,
                            {
                              backgroundColor: colors.backgroundElement,
                              borderColor: colors.border,
                            },
                          ]}
                          onPress={() => openExternalLink(verificationUrl, badge.name)}
                          activeOpacity={0.7}
                        >
                          {badge.image_url ? (
                            <Image
                              source={{ uri: badge.image_url }}
                              style={styles.badgeThumbnail}
                              resizeMode="contain"
                            />
                          ) : (
                            <Award size={22} color={colors.tint} />
                          )}
                          <View style={styles.badgeInfo}>
                            <ThemedText style={styles.badgeName} numberOfLines={1}>
                              {badge.name}
                            </ThemedText>
                            <ThemedText style={styles.badgeMeta} themeColor="textSecondary">
                              {[badge.category, badge.year ? `Ano ${badge.year}` : null]
                                .filter(Boolean)
                                .join(' · ') || 'Selo Oficial'}
                            </ThemedText>
                          </View>
                          <ExternalLink size={13} color={colors.textSecondary} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Nota de rodapé / disclaimer */}
              <View style={[styles.disclaimerBox, { borderColor: colors.border }]}>
                <ThemedText style={styles.disclaimerText} themeColor="textSecondary">
                  As informações desta página são baseadas em dados públicos e avaliações de clientes verificados pelo Avalia Solar. Este perfil é de responsabilidade da empresa.
                </ThemedText>
              </View>
            </View>
          )}

          {/* ── SERVIÇOS ────────────────────────────────────────────────── */}
          {activeTab === 'services' && (
            <View style={styles.section}>
              <View style={styles.servicesGrid}>
                {['On-Grid', 'Off-Grid', 'Híbrido', 'Manutenção', 'Limpeza', 'Financiamento'].map(
                  (service, idx) => (
                    <View
                      key={idx}
                      style={[styles.serviceChip, { backgroundColor: colors.surfaceSubtle }]}
                    >
                      <ThemedText style={styles.serviceChipText}>{service}</ThemedText>
                    </View>
                  )
                )}
              </View>
            </View>
          )}

          {/* ── AVALIAÇÕES ──────────────────────────────────────────────── */}
          {activeTab === 'reviews' && (
            <View style={styles.section}>
              {/* Botão avaliar */}
              <TouchableOpacity
                style={[styles.evalBtn, { borderColor: colors.tint }]}
                onPress={() => {
                  haptic();
                  setShowReviewForm((v) => !v);
                }}
              >
                <Star size={15} color={colors.tint} />
                <ThemedText style={[styles.evalBtnText, { color: colors.tint }]}>
                  {showReviewForm ? 'Cancelar avaliação' : 'Avaliar esta empresa'}
                </ThemedText>
              </TouchableOpacity>

              {/* Form review */}
              {showReviewForm && (
                <View
                  style={[
                    styles.reviewForm,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
                >
                  <ThemedText style={styles.formLabel}>Sua nota:</ThemedText>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => setNewRating(star)}>
                        <Star
                          size={26}
                          color={colors.starYellow}
                          fill={star <= newRating ? colors.starYellow : 'transparent'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    placeholder="Título (ex: Excelente serviço!)"
                    placeholderTextColor={colors.textSecondary}
                    style={[
                      styles.formInput,
                      { color: colors.text, borderColor: colors.border },
                    ]}
                    value={newTitle}
                    onChangeText={setNewTitle}
                  />

                  <TextInput
                    placeholder="Seu comentário detalhado..."
                    placeholderTextColor={colors.textSecondary}
                    style={[
                      styles.formTextarea,
                      { color: colors.text, borderColor: colors.border },
                    ]}
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
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Send size={13} color="#fff" />
                        <ThemedText style={styles.submitReviewBtnText}>Enviar Avaliação</ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Lista reviews */}
              {isLoadingReviews ? (
                <ActivityIndicator color={colors.tint} style={{ marginTop: 16 }} />
              ) : reviews.length === 0 ? (
                <ThemedText style={styles.emptyText} themeColor="textSecondary">
                  Nenhuma avaliação ainda. Seja o primeiro!
                </ThemedText>
              ) : (
                <View style={styles.reviewsList}>
                  {reviews.slice(0, 5).map((review: Review) => (
                    <View
                      key={review.id}
                      style={[styles.reviewCard, { borderColor: colors.border }]}
                    >
                      <View style={styles.reviewHeader}>
                        <ThemedText style={styles.reviewerName}>
                          {review.reviewer_name}
                        </ThemedText>
                        <View style={styles.reviewStars}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={11}
                              color={colors.starYellow}
                              fill={s <= review.rating ? colors.starYellow : 'transparent'}
                            />
                          ))}
                        </View>
                      </View>
                      {review.title ? (
                        <ThemedText style={styles.reviewTitle}>{review.title}</ThemedText>
                      ) : null}
                      {(review as any).comment ? (
                        <ThemedText style={styles.reviewComment} themeColor="textSecondary">
                          {(review as any).comment}
                        </ThemedText>
                      ) : null}
                    </View>
                  ))}
                  {reviews.length > 5 && (
                    <TouchableOpacity
                      style={[styles.viewAllBtn, { backgroundColor: colors.surfaceSubtle }]}
                      onPress={() => router.push(`/company/${company.id}/reviews` as any)}
                    >
                      <ThemedText style={[styles.viewAllText, { color: colors.tint }]}>
                        Ver todas as {reviews.length} avaliações
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {/* ── CONTATO ─────────────────────────────────────────────────── */}
          {activeTab === 'contact' && (
            <View style={styles.section}>
              <View style={styles.contactList}>
                {company.p2p_chat_enabled && canUseP2PChat && (
                  <TouchableOpacity
                    style={[styles.contactItem, { backgroundColor: '#F97316' }]}
                    onPress={() => router.push(`/p2p_chat?company_id=${company.id}` as any)}
                  >
                    <MessageSquare size={16} color="#fff" />
                    <ThemedText style={[styles.contactItemText, { color: '#fff', fontWeight: 'bold' }]}>
                      Chat Direto
                    </ThemedText>
                  </TouchableOpacity>
                )}

                {company.phone && (
                  <TouchableOpacity
                    style={[styles.contactItem, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                    onPress={() => {
                      trackLeadSent(company.id, 'phone');
                      Linking.openURL(`tel:${company.phone}`);
                    }}
                  >
                    <Phone size={16} color={colors.tint} />
                    <ThemedText style={styles.contactItemText}>{company.phone}</ThemedText>
                  </TouchableOpacity>
                )}

                {company.email && (
                  <TouchableOpacity
                    style={[styles.contactItem, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                    onPress={() => Linking.openURL(`mailto:${company.email}`)}
                  >
                    <Mail size={16} color={colors.tint} />
                    <ThemedText style={styles.contactItemText}>{company.email}</ThemedText>
                  </TouchableOpacity>
                )}

                {company.website && (
                  <TouchableOpacity
                    style={[styles.contactItem, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                    onPress={() => openExternalLink(company.website!, cleanWebsite || company.website!)}
                  >
                    <Globe size={16} color={colors.tint} />
                    <ThemedText style={styles.contactItemText}>
                      {cleanWebsite || company.website}
                    </ThemedText>
                    <ExternalLink size={13} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── STICKY BOTTOM CTA BAR ────────────────────────────────────────── */}
      {isPaid && (
        <View
          style={[
            styles.stickyBar,
            {
              backgroundColor: colors.backgroundElement,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.ctaPrimary, { backgroundColor: colors.tint }]}
            onPress={() => {
              haptic();
              router.push(`/company/${company.id}/lead` as any);
            }}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.ctaPrimaryText}>Solicitar Orçamento Grátis</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctaSecondary, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
            onPress={() => {
              haptic();
              router.push(`/compare?company_id=${company.id}` as any);
            }}
            activeOpacity={0.85}
          >
            <UserCheck size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────────────────────
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
    borderRadius: Radius.md,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Banner
  bannerContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerGradient: {
    position: 'absolute',
    inset: 0,
    // Simula gradiente escuro nos cantos via opacidade
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  iconBack: {
    position: 'absolute',
    top: 12,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRightActions: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Logo flutuante
  logoWrapper: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
  },
  logoImage: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: Radius.md,
    borderWidth: 3,
    backgroundColor: '#fff',
  },
  logoPlaceholder: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: Radius.md,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Header info
  headerInfo: {
    paddingBottom: Spacing.two,
    // Padding esquerdo respeitando a logo flutuante + padding direito normal
    paddingLeft: LOGO_SIZE + 24,
    paddingRight: Spacing.four,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  planBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  planBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  ratingMeta: {
    fontSize: 12,
  },

  // Chips de metadados — full width ignorando o offset do logo
  chipsScroll: {
    marginTop: 8,
    marginLeft: -(LOGO_SIZE + 8), // recua até a borda esquerda real
    marginRight: -Spacing.four,
  },
  chipsContent: {
    flexDirection: 'row',
    gap: 6,
    paddingLeft: 16,
    paddingRight: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Tab bar
  tabBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
  },
  tabBarContent: {
    paddingHorizontal: 12,
    gap: 0,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 13,
    letterSpacing: 0.1,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 2,
  },

  // Tab content
  tabContent: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },

  // Descrição
  descriptionText: {
    fontSize: 14,
    lineHeight: 21,
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 6,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Disclaimer
  disclaimerBox: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },

  // Badges
  badgesContainer: {
    gap: 8,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  badgeThumbnail: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '700',
  },
  badgeMeta: {
    fontSize: 11,
    marginTop: 1,
  },

  // Serviços
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  serviceChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Avaliações
  evalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  evalBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  reviewForm: {
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  formInput: {
    height: 40,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  formTextarea: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  submitReviewBtn: {
    height: 40,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  submitReviewBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
    textAlign: 'center',
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '700',
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
  viewAllBtn: {
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Contato
  contactList: {
    gap: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  contactItemText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  // Sticky bottom bar
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    // Blur não é suportado nativamente via StyleSheet; usar na web
  },
  ctaPrimary: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  ctaPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  ctaSecondary: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
