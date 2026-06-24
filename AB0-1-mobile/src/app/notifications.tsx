import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, BellOff, MessageSquare, ClipboardCheck, Star, Trash2 } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';
import { conversationsApi } from '@/lib/api';

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
  const user = useAuthStore((state) => state.user);
  const canUseP2PChat = user?.role === 'review';
  const [loading, setLoading] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      if (!canUseP2PChat) {
        setNotifications([]);
        return;
      }

      setLoading(true);
      try {
        const conversations = await conversationsApi.getAll();
        if (!active) return;

        setNotifications(
          conversations
            .filter((conversation) => (conversation.unread_count || 0) > 0)
            .map((conversation) => ({
              id: conversation.id,
              title: conversation.company_name || conversation.company?.name || 'Nova mensagem',
              body:
                typeof conversation.last_message === 'string'
                  ? conversation.last_message || 'Você recebeu uma nova mensagem.'
                  : conversation.last_message?.body || 'Você recebeu uma nova mensagem.',
              time: conversation.last_message_at
                ? new Date(conversation.last_message_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Agora',
              type: 'message',
              unread: true,
            }))
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadNotifications();

    return () => {
      active = false;
    };
  }, [canUseP2PChat]);

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
      router.push(canUseP2PChat ? { pathname: '/p2p_chat', params: { conversation_id: String(n.id) } } : '/profile');
    } else if (n.type === 'lead') {
      router.push('/requests');
    } else if (n.type === 'review') {
      router.push('/profile');
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare size={16} color={colors.tint} />;
      case 'lead':
        return <ClipboardCheck size={16} color={colors.success} />;
      case 'review':
        return <Star size={16} color={colors.starYellow} />;
      default:
        return <Bell size={16} color={colors.tint} />;
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
                <Trash2 size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={colors.tint} style={{ marginTop: Spacing.six }} />
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <BellOff size={48} color={colors.textSecondary} />
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
                    n.unread && { backgroundColor: 'rgba(32, 138, 239, 0.05)', borderLeftColor: colors.tint, borderLeftWidth: 4 }
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
