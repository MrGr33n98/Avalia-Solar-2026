import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageSquare, ArrowLeft, ChevronRight, UserPlus } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

interface ChatSession {
  id: number;
  name: string;
  avatarUrl: string | null;
  lastMessage: string;
  time: string;
  unreadCount: number;
  companyId: number;
}

export default function ChatListScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const { user } = useAuthStore();

  const chatSessions: ChatSession[] = [
    {
      id: 1,
      name: 'EcoVolt Engenharia',
      avatarUrl: null,
      lastMessage: 'Olá! Recebemos sua simulação da fatura e o projeto residencial está pronto.',
      time: 'Há 5 min',
      unreadCount: 1,
      companyId: 2,
    },
    {
      id: 2,
      name: 'Solar SP Distribuidora',
      avatarUrl: null,
      lastMessage: 'A visita técnica pode ser agendada para quarta-feira à tarde?',
      time: 'Ontem',
      unreadCount: 0,
      companyId: 1,
    },
  ];

  // 1. Estado deslogado
  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContainer}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(32, 138, 239, 0.1)' }]}>
              <MessageSquare size={48} color="#208AEF" />
            </View>
            <ThemedText type="subtitle" style={styles.centerTitle}>
              Seu Chat do Avalia Solar
            </ThemedText>
            <ThemedText style={styles.centerSubtitle} themeColor="textSecondary">
              Faça login para conversar diretamente com as empresas instaladoras credenciadas.
            </ThemedText>
            
            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: '#208AEF' }]}
              onPress={() => router.push('/profile')}
            >
              <ThemedText style={styles.loginBtnText}>Entrar na Conta</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color={colors.text} size={22} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Mensagens</ThemedText>
        </View>

        {/* List of Chats */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {chatSessions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MessageSquare size={40} color="#8E8E93" />
              <ThemedText style={styles.emptyText}>Nenhuma conversa aberta ainda.</ThemedText>
            </View>
          ) : (
            <View style={styles.list}>
              {chatSessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={[styles.chatCard, { backgroundColor: colors.backgroundElement }]}
                  onPress={() => router.push(`/chat/${session.id}`)}
                >
                  {session.avatarUrl ? (
                    <Image source={{ uri: session.avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.backgroundSelected }]}>
                      <ThemedText style={styles.avatarLetter}>{session.name[0]}</ThemedText>
                    </View>
                  )}

                  <View style={styles.cardInfo}>
                    <View style={styles.cardTopRow}>
                      <ThemedText style={styles.nameText}>{session.name}</ThemedText>
                      <ThemedText style={styles.timeText} themeColor="textSecondary">
                        {session.time}
                      </ThemedText>
                    </View>
                    
                    <View style={styles.cardBottomRow}>
                      <ThemedText style={[styles.lastMsgText, session.unreadCount > 0 && { fontWeight: '600', color: colors.text }]} themeColor="textSecondary" numberOfLines={1}>
                        {session.lastMessage}
                      </ThemedText>
                      
                      {session.unreadCount > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: '#208AEF' }]}>
                          <ThemedText style={styles.unreadBadgeText}>{session.unreadCount}</ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  backBtn: {
    padding: Spacing.one,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
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
  list: {
    gap: Spacing.three,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(142, 142, 147, 0.06)',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003E7E',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 11,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  lastMsgText: {
    fontSize: 12,
    flex: 1,
  },
  unreadBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
