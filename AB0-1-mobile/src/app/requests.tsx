import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ClipboardList, MessageSquare, Phone, Mail, ChevronRight, UserPlus, Info } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';
import { leadsApi } from '@/lib/api';

export default function RequestsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const { user } = useAuthStore();

  // Buscar leads/solicitações da API (habilitado apenas se estiver logado)
  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ['user-leads', user?.id],
    queryFn: () => leadsApi.getByUser(),
    enabled: !!user,
  });

  const handleContactWhatsApp = (phone: string, clientName: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá, sou da empresa parceira do Avalia Solar. Recebi sua solicitação de orçamento.`);
    const url = `https://wa.me/55${cleanPhone}?text=${message}`;
    
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.warn('Não foi possível abrir o WhatsApp');
      }
    });
  };

  // 1. Estado deslogado
  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContainer}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(32, 138, 239, 0.1)' }]}>
              <ClipboardList size={48} color="#208AEF" />
            </View>
            <ThemedText type="subtitle" style={styles.centerTitle}>
              Acesse suas solicitações
            </ThemedText>
            <ThemedText style={styles.centerSubtitle} themeColor="textSecondary">
              Faça login para acompanhar os orçamentos solicitados ou leads recebidos de potenciais clientes.
            </ThemedText>
            
            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: '#208AEF' }]}
              onPress={() => router.push('/profile')}
            >
              <ThemedText style={styles.loginBtnText}>Ir para Login</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // 2. Estado de Carregamento
  if (isLoading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#208AEF" />
        <ThemedText style={{ marginTop: Spacing.three }}>Buscando orçamentos...</ThemedText>
      </ThemedView>
    );
  }

  const leadsList = leads.length > 0 ? leads : (user.role === 'company' ? mockCompanyLeads : mockConsumerRequests);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">
            {user.role === 'company' ? 'Leads Recebidos' : 'Meus Orçamentos'}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle} themeColor="textSecondary">
            {user.role === 'company'
              ? 'Potenciais clientes aguardando seu contato'
              : 'Acompanhe o andamento dos seus pedidos'}
          </ThemedText>
        </View>

        {/* List */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {leadsList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ClipboardList size={40} color="#8E8E93" />
              <ThemedText style={styles.emptyText}>Nenhuma solicitação encontrada</ThemedText>
            </View>
          ) : (
            leadsList.map((lead: any) => (
              <View key={lead.id} style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
                
                {/* Cabeçalho do Card */}
                <View style={styles.cardHeader}>
                  <View>
                    <ThemedText style={styles.cardTitle}>
                      {user.role === 'company' ? lead.name : lead.company_name}
                    </ThemedText>
                    <ThemedText style={styles.cardDate} themeColor="textSecondary">
                      Solicitado em {lead.created_at}
                    </ThemedText>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lead.status).bg }]}>
                    <ThemedText style={[styles.statusText, { color: getStatusColor(lead.status).text }]}>
                      {lead.status_label || lead.status}
                    </ThemedText>
                  </View>
                </View>

                {/* Detalhes específicos de Leads recebidos por Empresas */}
                {user.role === 'company' ? (
                  <View style={styles.companyLeadDetails}>
                    <View style={styles.infoRow}>
                      <Mail size={14} color="#8E8E93" />
                      <ThemedText style={styles.infoText}>{lead.email}</ThemedText>
                    </View>
                    <View style={styles.infoRow}>
                      <Phone size={14} color="#8E8E93" />
                      <ThemedText style={styles.infoText}>{lead.phone}</ThemedText>
                    </View>
                    {lead.message && (
                      <View style={styles.messageRow}>
                        <MessageSquare size={14} color="#8E8E93" style={{ marginTop: 2 }} />
                        <ThemedText style={styles.messageText} themeColor="textSecondary">
                          "{lead.message}"
                        </ThemedText>
                      </View>
                    )}

                    {/* Botões de Ação para Empresas */}
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
                        onPress={() => handleContactWhatsApp(lead.phone, lead.name)}
                      >
                        <MessageSquare size={16} color="#ffffff" />
                        <ThemedText style={styles.actionBtnText}>WhatsApp</ThemedText>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#208AEF' }]}
                        onPress={() => Linking.openURL(`mailto:${lead.email}`)}
                      >
                        <Mail size={16} color="#ffffff" />
                        <ThemedText style={styles.actionBtnText}>E-mail</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  // Detalhes específicos de solicitações enviadas por Consumidores
                  <View style={styles.consumerRequestDetails}>
                    <View style={styles.infoRow}>
                      <Info size={14} color="#8E8E93" />
                      <ThemedText style={styles.infoText}>
                        Vertical: {lead.vertical_label || 'Energia Solar Residencial'}
                      </ThemedText>
                    </View>
                    {lead.message && (
                      <View style={styles.messageRow}>
                        <MessageSquare size={14} color="#8E8E93" style={{ marginTop: 2 }} />
                        <ThemedText style={styles.messageText} themeColor="textSecondary">
                          Sua mensagem: "{lead.message}"
                        </ThemedText>
                      </View>
                    )}
                  </View>
                )}

              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// Helpers de Cores de Status
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'novo':
    case 'new':
      return { bg: 'rgba(32, 138, 239, 0.1)', text: '#208AEF' };
    case 'respondido':
    case 'answered':
    case 'completed':
      return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981' };
    case 'cancelado':
    case 'cancelled':
      return { bg: 'rgba(229, 62, 62, 0.1)', text: '#E53E3E' };
    default:
      return { bg: 'rgba(142, 142, 147, 0.1)', text: '#8E8E93' };
  }
};

// Mocks locais de fallback para fins de visualização
const mockCompanyLeads = [
  {
    id: 1,
    name: 'Carlos Oliveira',
    email: 'carlos.oliveira@email.com',
    phone: '11999998888',
    message: 'Gostaria de um orçamento para instalação de 10 placas solares na minha casa em Campinas.',
    created_at: '14/06/2026',
    status: 'novo',
    status_label: 'Novo',
  },
  {
    id: 2,
    name: 'Fernanda Costa',
    email: 'fernanda.costa@email.com',
    phone: '11988887777',
    message: 'Procuro orçamento de carregador veicular elétrico Wallbox para minha garagem em prédio residencial.',
    created_at: '12/06/2026',
    status: 'respondido',
    status_label: 'Respondido',
  },
];

const mockConsumerRequests = [
  {
    id: 1,
    company_name: 'Solar SP Distribuidora',
    vertical_label: 'Energia Solar Residencial',
    message: 'Solicitação de cotação para projeto residencial.',
    created_at: '14/06/2026',
    status: 'novo',
    status_label: 'Enviado',
  },
  {
    id: 2,
    company_name: 'EcoVolt Engenharia',
    vertical_label: 'Mobilidade Elétrica',
    message: 'Wallbox instalado em garagem subterrânea.',
    created_at: '10/06/2026',
    status: 'respondido',
    status_label: 'Respondido',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    textAlign: 'center',
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  centerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
  },
  centerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.four,
  },
  loginBtn: {
    height: 46,
    paddingHorizontal: Spacing.five,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.two,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(142, 142, 147, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardDate: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  companyLeadDetails: {
    gap: Spacing.one,
  },
  consumerRequestDetails: {
    gap: Spacing.two,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  infoText: {
    fontSize: 13,
  },
  messageRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  messageText: {
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  actionBtn: {
    flex: 1,
    height: 38,
    borderRadius: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
