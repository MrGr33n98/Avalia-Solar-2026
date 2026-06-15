import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, BellOff, MessageSquare, ClipboardCheck, Star, Trash2 } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

interface Notification {
  id: number;
  title: string;
  body: string;
  time: string;
  type: 'message' | 'lead' | 'review' | 'system';
  unread: boolean;
}

export default function NotificationsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'Nova proposta recebida!',
      body: 'EcoVolt Engenharia respondeu ao seu pedido de orçamento solar. Veja a conversa.',
      time: 'Há 5 min',
      type: 'message',
      unread: true,
    },
    {
      id: 2,
      title: 'Avaliação publicada!',
      body: 'Sua avaliação sobre Fronius Brasil Solar foi aprovada e já está visível no perfil da empresa.',
      time: 'Há 2 horas',
      type: 'review',
      unread: true,
    },
    {
      id: 3,
      title: 'Economize mais hoje',
      body: 'Experimente a nova ferramenta de Scanner de Faturas de energia e simule grátis.',
      time: 'Há 1 dia',
      type: 'system',
      unread: false,
    },
    {
      id: 4,
      title: 'Orçamento entregue',
      body: 'Seu lead para BYD Energy foi entregue com sucesso.',
      time: 'Há 3 dias',
      type: 'lead',
      unread: false,
    },
  ]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handlePress = (n: Notification) => {
    // Marca como lida
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item));
    
    // Redirecionamento baseado no tipo
    if (n.type === 'message') {
      router.push('/chat');
    } else if (n.type === 'lead') {
      router.push('/requests');
    } else if (n.type === 'review') {
      router.push('/profile');
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare size={16} color="#208AEF" />;
      case 'lead':
        return <ClipboardCheck size={16} color="#10B981" />;
      case 'review':
        return <Star size={16} color="#F59E0B" />;
      default:
        return <Bell size={16} color="#8B5CF6" />;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft color={colors.text} size={22} />
            </TouchableOpacity>
            <ThemedText type="subtitle">Notificações</ThemedText>
          </View>
          
          {notifications.length > 0 && (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={markAllAsRead} style={{ marginRight: Spacing.three }}>
                <ThemedText style={styles.actionText}>Lidas</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearAll}>
                <Trash2 size={16} color="#E53E3E" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <BellOff size={48} color="#8E8E93" />
              <ThemedText type="subtitle" style={styles.emptyTitle}>
                Nenhuma notificação por aqui
              </ThemedText>
              <ThemedText style={styles.emptySubtitle} themeColor="textSecondary">
                Avisaremos você quando receber propostas de orçamentos ou alertas.
              </ThemedText>
            </View>
          ) : (
            <View style={styles.list}>
              {notifications.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={[
                    styles.notificationCard,
                    { backgroundColor: colors.backgroundElement },
                    n.unread && { backgroundColor: 'rgba(32, 138, 239, 0.05)', borderLeftColor: '#208AEF', borderLeftWidth: 4 }
                  ]}
                  onPress={() => handlePress(n)}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.headerLeftRow}>
                      <View style={[styles.iconWrapper, { backgroundColor: colors.background }]}>
                        {getIcon(n.type)}
                      </View>
                      <ThemedText style={styles.cardTitle}>{n.title}</ThemedText>
                    </View>
                    <ThemedText style={styles.timeText} themeColor="textSecondary">
                      {n.time}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.bodyText} themeColor="textSecondary">
                    {n.body}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  backBtn: {
    padding: Spacing.one,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#208AEF',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six * 2,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: Spacing.two,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.four,
  },
  list: {
    gap: Spacing.three,
  },
  notificationCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(142, 142, 147, 0.06)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  timeText: {
    fontSize: 10,
  },
  bodyText: {
    fontSize: 12,
    lineHeight: 16,
    paddingLeft: 28 + Spacing.two,
  },
});
