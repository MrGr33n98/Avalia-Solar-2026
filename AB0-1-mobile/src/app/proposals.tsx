import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  GitCompareArrows,
  RefreshCw,
  Zap,
} from 'lucide-react-native';

import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';
import { marketplaceProposalsApi } from '@/lib/api';

// ---------------------------------------------------------------------------
// Tipos locais mínimos
// ---------------------------------------------------------------------------
interface ProposalCompany {
  id: number;
  name: string;
  logo_url?: string | null;
}

interface ProposalVersion {
  id: number;
  total_cents: number;
  published_at?: string | null;
  valid_until?: string | null;
}

interface ProposalRequest {
  city?: string | null;
  state?: string | null;
}

interface Proposal {
  id: number;
  reference: string;
  status: string;
  currency: string;
  total_cents?: number | null;
  created_at: string;
  published_at?: string | null;
  expires_at?: string | null;
  revision_pending?: boolean;
  company: ProposalCompany;
  version?: ProposalVersion | null;
  request?: ProposalRequest | null;
  project?: { status?: string } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  draft:                 { label: 'Em preparação',    bg: '#F1F5F9', text: '#64748B' },
  sent:                  { label: 'Recebida',          bg: '#EFF6FF', text: '#1D4ED8' },
  viewed:                { label: 'Visualizada',       bg: '#F5F3FF', text: '#6D28D9' },
  under_review:          { label: 'Em análise',        bg: '#FFFBEB', text: '#92400E' },
  negotiating:           { label: 'Em negociação',     bg: '#FFF7ED', text: '#C2410C' },
  meeting_scheduled:     { label: 'Reunião agendada',  bg: '#FFF7ED', text: '#B45309' },
  accepted:              { label: 'Em andamento',      bg: '#ECFDF5', text: '#065F46' },
  declined:              { label: 'Recusada',          bg: '#FEF2F2', text: '#991B1B' },
  not_selected:          { label: 'Não escolhida',     bg: '#F1F5F9', text: '#64748B' },
  closed_after_selection:{ label: 'Encerrada',         bg: '#F1F5F9', text: '#64748B' },
  completed:             { label: 'Concluído',         bg: '#ECFDF5', text: '#065F46' },
};

function resolveStatus(p: Proposal) {
  if (p.project?.status === 'completed') return STATUS_MAP['completed'];
  if (p.revision_pending) return { label: 'Em atualização', bg: '#FFFBEB', text: '#92400E' };
  if (p.status === 'accepted') {
    return p.project?.status === 'cancelled'
      ? { label: 'Projeto cancelado', bg: '#FEF2F2', text: '#991B1B' }
      : STATUS_MAP['accepted'];
  }
  return STATUS_MAP[p.status] ?? { label: p.status, bg: '#F1F5F9', text: '#64748B' };
}

function formatMoney(cents?: number | null, currency = 'BRL') {
  if (cents == null) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(cents / 100);
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(d);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Filtros
// ---------------------------------------------------------------------------
type Filter = 'all' | 'active' | 'completed' | 'closed';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',       label: 'Todas'        },
  { id: 'active',    label: 'Em andamento' },
  { id: 'completed', label: 'Concluídas'   },
  { id: 'closed',    label: 'Encerradas'   },
];

const ACTIVE_STATUSES = [
  'sent', 'viewed', 'under_review', 'negotiating', 'meeting_scheduled', 'accepted',
];
const CLOSED_STATUSES = [
  'declined', 'not_selected', 'closed_after_selection', 'withdrawn', 'expired',
];

function matchFilter(p: Proposal, f: Filter) {
  if (f === 'all') return true;
  if (f === 'completed') return p.project?.status === 'completed' || p.status === 'completed';
  if (f === 'active')
    return ACTIVE_STATUSES.includes(p.status) && p.project?.status !== 'completed';
  if (f === 'closed') return CLOSED_STATUSES.includes(p.status);
  return true;
}

// ---------------------------------------------------------------------------
// CompanyAvatar
// ---------------------------------------------------------------------------
function CompanyAvatar({
  company,
  colors,
}: {
  company: ProposalCompany;
  colors: typeof Colors.light;
}) {
  return (
    <View style={[styles.avatar, { backgroundColor: colors.tint + '18' }]}>
      <Text style={[styles.avatarText, { color: colors.tint }]}>{initials(company.name)}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ProposalCard
// ---------------------------------------------------------------------------
function ProposalCard({
  proposal,
  colors,
  onPress,
}: {
  proposal: Proposal;
  colors: typeof Colors.light;
  onPress: () => void;
}) {
  const st = resolveStatus(proposal);
  const value = formatMoney(
    proposal.version?.total_cents ?? proposal.total_cents,
    proposal.currency,
  );
  const updatedAt = formatDate(
    proposal.version?.published_at ?? proposal.published_at ?? proposal.created_at,
  );
  const location = proposal.request?.city
    ? `${proposal.request.city}${proposal.request.state ? `, ${proposal.request.state}` : ''}`
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.backgroundElement,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        },
        Shadows.sm,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Proposta da empresa ${proposal.company.name}`}
    >
      {/* Cabeçalho */}
      <View style={styles.cardHeader}>
        <CompanyAvatar company={proposal.company} colors={colors} />
        <View style={styles.cardTitleBlock}>
          <Text style={[styles.cardCompanyName, { color: colors.text }]} numberOfLines={1}>
            {proposal.company.name}
          </Text>
          <Text style={[styles.cardRef, { color: colors.textSecondary }]} numberOfLines={1}>
            {proposal.reference}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: st.text }]} />
          <Text style={[styles.statusText, { color: st.text }]}>{st.label}</Text>
        </View>
      </View>

      {/* Valor */}
      <Text
        style={[
          styles.cardValue,
          { color: value ? colors.tint : colors.textSecondary },
        ]}
      >
        {value ?? 'Aguardando empresa'}
      </Text>

      {/* Meta */}
      <View style={styles.cardMeta}>
        {location ? (
          <Text
            style={[styles.cardMetaText, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            📍 {location}
          </Text>
        ) : null}
        {updatedAt ? (
          <Text style={[styles.cardMetaText, { color: colors.textSecondary }]}>
            Atualizada em {updatedAt}
          </Text>
        ) : null}
      </View>

      {/* Seta */}
      <View style={styles.cardArrow}>
        <ArrowRight size={14} color={colors.textSecondary} />
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Tela principal
// ---------------------------------------------------------------------------
export default function ProposalsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user } = useAuthStore();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      setError('');
      try {
        const res = await marketplaceProposalsApi.list();
        setProposals(res.proposals ?? []);
      } catch {
        setError('Não foi possível carregar suas propostas. Toque para tentar novamente.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (user) void load();
    else setLoading(false);
  }, [user, load]);

  // Não autenticado
  if (!user) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={styles.centerBox}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.tint + '18' }]}>
            <ClipboardList size={40} color={colors.tint} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Suas propostas ficam aqui
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Faça login para acompanhar as propostas das empresas solares.
          </Text>
          <Pressable
            style={[styles.ctaBtn, { backgroundColor: colors.tint }]}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.ctaBtnText}>Entrar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Loading inicial
  if (loading) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={styles.loadingHeaderArea}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Minhas propostas</Text>
        </View>
        <View style={styles.skeletons}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.skeletonCard,
                { backgroundColor: colors.backgroundElement, borderColor: colors.border },
              ]}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const filtered = proposals.filter((p) => matchFilter(p, filter));
  const counts = FILTERS.reduce<Record<Filter, number>>(
    (acc, f) => {
      acc[f.id] = proposals.filter((p) => matchFilter(p, f.id)).length;
      return acc;
    },
    { all: 0, active: 0, completed: 0, closed: 0 },
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.screenTitle, { color: colors.text }]}>Minhas propostas</Text>
            <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
              Da conversa ao projeto concluído
            </Text>
          </View>
          <Pressable
            onPress={() => void load(true)}
            disabled={refreshing}
            style={styles.refreshBtn}
            accessibilityLabel="Atualizar propostas"
          >
            <RefreshCw
              size={18}
              color={refreshing ? colors.textSecondary : colors.tint}
            />
          </Pressable>
        </View>

        {/* Filtros */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.tint : colors.surfaceSubtle,
                    borderColor: active ? colors.tint : 'transparent',
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: active ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {f.label}
                </Text>
                <Text
                  style={[
                    styles.filterChipCount,
                    { color: active ? 'rgba(255,255,255,0.75)' : colors.textSecondary },
                  ]}
                >
                  {counts[f.id]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Erro */}
      {error ? (
        <Pressable
          style={[
            styles.errorBox,
            { backgroundColor: colors.backgroundElement, borderColor: colors.border },
          ]}
          onPress={() => void load()}
        >
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          <Text style={[styles.errorRetry, { color: colors.tint }]}>Tentar novamente</Text>
        </Pressable>
      ) : null}

      {/* Vazio */}
      {!error && filtered.length === 0 ? (
        <View style={styles.centerBox}>
          {proposals.length === 0 ? (
            <>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.tint + '18' }]}>
                <ClipboardList size={40} color={colors.tint} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Suas propostas ficam aqui
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Quando uma empresa responder sua solicitação, você poderá comparar e dar o próximo
                passo.
              </Text>
              <Pressable
                style={[styles.ctaBtn, { backgroundColor: colors.tint }]}
                onPress={() => router.push('/explore')}
              >
                <Zap size={16} color="#FFFFFF" />
                <Text style={styles.ctaBtnText}>Encontrar empresas</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceSubtle }]}>
                <CheckCircle2 size={32} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Nenhuma proposta neste filtro.
              </Text>
            </>
          )}
        </View>
      ) : (
        !error && (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void load(true)}
                tintColor={colors.tint}
              />
            }
            renderItem={({ item }) => (
              <ProposalCard
                proposal={item}
                colors={colors}
                onPress={() => {
                  // Navegação para detalhe — implementada em T020
                  // router.push({ pathname: '/proposal/[id]', params: { id: item.id } });
                }}
              />
            )}
            ListFooterComponent={
              filtered.length >= 2 ? (
                <Pressable
                  style={[
                    styles.compareBar,
                    {
                      backgroundColor: colors.backgroundElement,
                      borderColor: colors.tint + '40',
                    },
                  ]}
                  onPress={() => router.push('/compare')}
                >
                  <GitCompareArrows size={16} color={colors.tint} />
                  <Text style={[styles.compareBarText, { color: colors.tint }]}>
                    Comparar propostas
                  </Text>
                </Pressable>
              ) : null
            }
          />
        )
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  flex: { flex: 1 },

  header: {
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  refreshBtn: {
    padding: Spacing.one,
    marginTop: 2,
  },

  filterRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    flexWrap: 'nowrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  filterChipCount: {
    fontSize: 10,
    fontWeight: '500',
  },

  loadingHeaderArea: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  skeletons: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  skeletonCard: {
    height: 110,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    opacity: 0.5,
  },

  listContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },

  card: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  cardCompanyName: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardRef: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: Spacing.two,
    letterSpacing: -0.5,
  },
  cardMeta: {
    marginTop: 4,
    gap: 2,
  },
  cardMetaText: {
    fontSize: 11,
  },
  cardArrow: {
    position: 'absolute',
    bottom: Spacing.two,
    right: Spacing.two,
  },

  errorBox: {
    margin: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  errorText: {
    fontSize: 13,
  },
  errorRetry: {
    fontSize: 13,
    fontWeight: '600',
  },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.two,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.four,
    paddingVertical: 13,
    borderRadius: Radius.full,
    marginTop: Spacing.two,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  compareBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: 14,
    marginTop: Spacing.two,
  },
  compareBarText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
