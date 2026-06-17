import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Linking,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, MessageSquare, Phone, Calendar, MapPin, Tag, Lock, X } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { UpgradePrompt } from '@/components/UpgradePrompt';

export default function DashboardLeadsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const { user } = useAuthStore();

  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremiumLocked, setIsPremiumLocked] = useState(true);
  const [planName, setPlanName] = useState('Gratuito');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    async function loadLeads() {
      try {
        // 1. Busca os leads reais da API do Dashboard
        const response = await fetchApi<{ data: any[] }>('dashboard/leads');
        setLeadsList(response?.data || []);

        // 2. Busca o feature access para validar bloqueio premium
        if (user?.company_id) {
          const accessRes = await fetchApi<any>(`companies/${user.company_id}/feature_access`);
          if (accessRes) {
            const currentPlan = accessRes.plan;
            setPlanName(
              currentPlan === 'free' 
                ? 'Gratuito' 
                : currentPlan === 'essential' 
                  ? 'Essencial' 
                  : currentPlan === 'pro' 
                    ? 'Pro' 
                    : 'Enterprise'
            );
            
            // O acesso a leads detalhados exige plano Essencial/Pro ou superior.
            // Se o plano for gratuito ou se o backend bloquear leads_marketplace explicitamente
            const isLocked = currentPlan === 'free' || 
                             accessRes.features?.leads_marketplace?.state === 'locked';
            setIsPremiumLocked(isLocked);
          }
        }
      } catch (error) {
        console.error('[Leads] Erro ao carregar leads:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLeads();
  }, [user]);

  const maskEmail = (email: string) => {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length < 2) return '***';
    const [local, domain] = parts;
    return `${local.substring(0, 2)}***@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone) return '';
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length >= 10) {
      return `(${clean.substring(0, 2)}) 9***-****`;
    }
    return '***-****';
  };

  const handleContactWhatsApp = (phone: string, name: string) => {
    if (isPremiumLocked) {
      setShowUpgradeModal(true);
      return;
    }
    const formattedPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Olá ${name}, recebemos sua solicitação de orçamento pelo Avalia Solar!`);
    const url = `https://wa.me/55${formattedPhone}?text=${message}`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
    });
  };

  const handleCall = (phone: string) => {
    if (isPremiumLocked) {
      setShowUpgradeModal(true);
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#003E7E" />
        <ThemedText style={{ marginTop: 12 }}>Carregando seus leads corporativos...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#1E293B" size={24} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Painel de Leads</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.statsSummary}>
          <ThemedText style={styles.statsTitle}>Leads Recebidos (Plano {planName})</ThemedText>
          <ThemedText style={styles.statsCount}>{leadsList.length}</ThemedText>
        </View>

        {isPremiumLocked && (
          <View style={styles.lockBanner}>
            <Lock size={16} color="#854D0E" style={{ marginRight: 8 }} />
            <ThemedText style={styles.lockBannerText}>
              Você está no plano Gratuito. Contatos e mensagens detalhadas de leads estão ocultos.
            </ThemedText>
          </View>
        )}

        <View style={styles.leadsGrid}>
          {leadsList.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyText} themeColor="textSecondary">
                Nenhum lead recebido ainda na sua região.
              </ThemedText>
            </View>
          ) : (
            leadsList.map((lead) => (
              <View key={lead.id} style={styles.leadCard}>
                <View style={styles.leadHeader}>
                  <ThemedText style={styles.leadName}>{lead.name}</ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: '#DBEAFE' }]}>
                    <ThemedText style={[styles.statusText, { color: '#2563EB' }]}>
                      Novo
                    </ThemedText>
                  </View>
                </View>

                {/* Informações detalhadas do Lead */}
                <View style={styles.detailsBlock}>
                  <View style={styles.infoRow}>
                    <Tag size={14} color="#8E8E93" style={{ marginRight: 8 }} />
                    <ThemedText style={styles.detailText}>{lead.project_type || 'Residencial'}</ThemedText>
                  </View>

                  <View style={styles.infoRow}>
                    <MapPin size={14} color="#8E8E93" style={{ marginRight: 8 }} />
                    <ThemedText style={styles.detailText}>{lead.location || 'Não especificada'}</ThemedText>
                  </View>

                  <View style={styles.infoRow}>
                    <Calendar size={14} color="#8E8E93" style={{ marginRight: 8 }} />
                    <ThemedText style={styles.detailText}>{formatDate(lead.created_at)}</ThemedText>
                  </View>
                </View>

                {/* Detalhes confidenciais (com lockout) */}
                <View style={[styles.lockedDetails, { backgroundColor: colors.backgroundElement }]}>
                  <ThemedText style={styles.lockedLabel}>E-mail:</ThemedText>
                  <ThemedText style={styles.lockedValue}>
                    {isPremiumLocked ? maskEmail(lead.email) : lead.email}
                  </ThemedText>
                </View>

                <View style={[styles.lockedDetails, { backgroundColor: colors.backgroundElement, marginTop: 6 }]}>
                  <ThemedText style={styles.lockedLabel}>Telefone:</ThemedText>
                  <ThemedText style={styles.lockedValue}>
                    {isPremiumLocked ? maskPhone(lead.phone) : lead.phone}
                  </ThemedText>
                </View>

                {/* Mensagem do Cliente */}
                {lead.message ? (
                  <View style={[styles.messageBox, { backgroundColor: '#F8FAFC' }]}>
                    <ThemedText style={styles.messageText} themeColor="textSecondary">
                      "{isPremiumLocked ? 'Mensagem oculta no plano Gratuito' : lead.message}"
                    </ThemedText>
                  </View>
                ) : null}

                {/* Ações */}
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { borderColor: '#E2E8F0', borderWidth: 1 }]}
                    onPress={() => handleCall(lead.phone)}
                  >
                    <Phone size={14} color="#475569" style={{ marginRight: 6 }} />
                    <ThemedText style={styles.actionBtnText}>Ligar</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
                    onPress={() => handleContactWhatsApp(lead.phone, lead.name)}
                  >
                    <MessageSquare size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <ThemedText style={[styles.actionBtnText, { color: '#FFFFFF' }]}>WhatsApp</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* Modal de Upgrade Prompt */}
      <Modal
        visible={showUpgradeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Desbloquear Leads</ThemedText>
              <TouchableOpacity onPress={() => setShowUpgradeModal(false)} style={styles.closeBtn}>
                <X size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>
            <UpgradePrompt 
              title="Acesso aos Leads de Venda"
              description="Instaladores no plano Gratuito possuem acesso limitado. Assine o plano Pro para visualizar telefones, e-mails e receber orçamentos prioritários diretos dos clientes."
              feature="Leads Marketplace"
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statsSummary: {
    backgroundColor: '#003E7E',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statsCount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    marginTop: 4,
  },
  lockBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF08A',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EAB308',
  },
  lockBannerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#854D0E',
    lineHeight: 16,
  },
  leadsGrid: {
    gap: 16,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leadName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  detailsBlock: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
  },
  lockedDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  lockedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    width: 60,
  },
  lockedValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
    flex: 1,
  },
  messageBox: {
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 4,
  },
});
