import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MessageCircle, ArrowLeft, Send } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';
import { conversationsApi, type Conversation, type Message } from '@/lib/api';
import { createConsumer, Consumer } from '@rails/actioncable';
import { getApiBaseUrl, getStoredToken } from '@/lib/api';

type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'rejected';

function getRealtimeLabel(status: RealtimeStatus) {
  if (status === 'connected') return 'ao vivo';
  if (status === 'connecting') return 'conectando';
  if (status === 'disconnected') return 'reconectando';
  if (status === 'rejected') return 'offline';
  return 'aguardando';
}

export default function P2PChatScreen() {
  const { company_id } = useLocalSearchParams<{ company_id?: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const { user } = useAuthStore();
  const canUseP2PChat = user?.role === 'review';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('idle');
  
  const cableRef = useRef<Consumer | null>(null);
  const channelRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!user) {
      router.replace('/profile');
      return;
    }

    if (!canUseP2PChat) {
      router.replace('/profile');
      return;
    }

    loadConversations();
    
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [canUseP2PChat, company_id, user?.id]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await conversationsApi.getAll();
      const list = data || [];
      setConversations(list);
      
      if (company_id) {
        let conv = list.find((c) => c.company_id === Number(company_id));
        if (!conv) {
          conv = await conversationsApi.create(Number(company_id));
          setConversations((prev) => (conv ? [conv, ...prev] : prev));
        }
        if (conv) selectConversation(conv);
      } else if (list.length > 0) {
        selectConversation(list[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar conversas", error);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv: Conversation) => {
    setActiveConversation(conv);
    try {
      await loadMessagesForConversation(conv.id);
      setupActionCable(conv.id);
    } catch (error) {
      console.error("Erro ao carregar mensagens", error);
    }
  };

  const loadMessagesForConversation = async (conversationId: number) => {
    const msgs = await conversationsApi.getMessages(conversationId);
    setMessages(msgs || []);
  };

  const setupActionCable = async (conversationId: number) => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }
    setRealtimeStatus('connecting');

    if (!cableRef.current) {
      const token = await getStoredToken();
      const wsUrl = getApiBaseUrl().replace('http', 'ws').replace('/api/v1', '/cable');
      cableRef.current = createConsumer(`${wsUrl}?token=${token}`);
    }

    channelRef.current = cableRef.current.subscriptions.create(
      { channel: "ConversationChannel", conversation_id: conversationId },
      {
        connected: () => {
          setRealtimeStatus('connected');
          loadMessagesForConversation(conversationId).catch((error) => {
            console.warn('[P2PChat] Could not reconcile messages after reconnect', error);
          });
        },
        disconnected: () => {
          setRealtimeStatus('disconnected');
        },
        rejected: () => {
          setRealtimeStatus('rejected');
        },
        received: (data: Message) => {
          setMessages((prev) => {
            if (prev.some((message) => message.id === data.id)) return prev;
            return [...prev, data];
          });
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    );
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeConversation) return;
    try {
      const msgText = inputMessage;
      setInputMessage("");
      const sentMessage = await conversationsApi.sendMessage(activeConversation.id, msgText);
      setMessages((prev) => {
        if (prev.some((message) => message.id === sentMessage.id)) return prev;
        return [...prev, sentMessage];
      });
    } catch (error) {
      console.error("Erro ao enviar mensagem", error);
    }
  };

  if (!user || !canUseP2PChat) {
    return <ThemedView style={styles.container}><ActivityIndicator color={colors.tint} style={{marginTop: 50}} /></ThemedView>;
  }

  // Se não tem conversa ativa e não tem company_id, mostra lista de conversas
  if (!activeConversation && !company_id) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft color={colors.text} size={22} />
            </TouchableOpacity>
            <ThemedText type="subtitle">Mensagens Diretas</ThemedText>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {loading ? (
              <ActivityIndicator color={colors.tint} />
            ) : conversations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MessageCircle size={40} color={colors.textSecondary} />
                <ThemedText style={{marginTop: 10}}>Você não tem nenhuma conversa.</ThemedText>
              </View>
            ) : (
              conversations.map((conv) => (
                <TouchableOpacity
                  key={conv.id}
                  style={styles.chatCard}
                  onPress={() => selectConversation(conv)}
                >
                  <View style={styles.chatInfo}>
                    <ThemedText style={styles.chatName}>
                      {conv.company_name || conv.company?.name || 'Empresa'}
                    </ThemedText>
                    <ThemedText style={[styles.chatLastMessage, { color: colors.textSecondary }]}>
                      {typeof conv.last_message === 'string' ? conv.last_message : conv.last_message?.body || 'Iniciar conversa...'}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // Tela da conversa ativa
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'left']}>
        <KeyboardAvoidingView 
          style={styles.keyboardView} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => {
              if (company_id) {
                router.back();
              } else {
                setActiveConversation(null);
              }
            }}>
              <ArrowLeft color={colors.text} size={22} />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <ThemedText type="subtitle" style={styles.chatTitle}>
                {activeConversation ? activeConversation.company_name || activeConversation.company?.name || 'Empresa' : 'Carregando...'}
              </ThemedText>
              <View style={styles.realtimeStatus}>
                <View
                  style={[
                    styles.realtimeDot,
                    realtimeStatus === 'connected'
                      ? styles.realtimeDotConnected
                      : realtimeStatus === 'connecting'
                        ? styles.realtimeDotConnecting
                        : null,
                  ]}
                />
                <ThemedText style={[styles.realtimeLabel, { color: colors.textSecondary }]}>
                  {getRealtimeLabel(realtimeStatus)}
                </ThemedText>
              </View>
            </View>
          </View>

          {loading && !activeConversation ? (
            <ActivityIndicator color={colors.tint} style={{marginTop: 50}} />
          ) : (
            <>
              <ScrollView 
                ref={scrollViewRef}
                contentContainerStyle={styles.messagesContainer}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              >
                {messages.map((msg, idx) => {
                  const isMine = msg.sender_type === 'User';
                  return (
                    <View
                      key={msg.id ?? idx}
                      style={[
                        styles.messageBubble,
                        isMine
                          ? [styles.myMessage, { backgroundColor: colors.tint }]
                          : styles.theirMessage,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.messageText,
                          isMine ? { color: colors.backgroundElement } : styles.theirMessageText,
                        ]}
                      >
                        {msg.body}
                      </ThemedText>
                    </View>
                  );
                })}
              </ScrollView>
              
              <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  placeholder="Mensagem..."
                  placeholderTextColor={colors.textSecondary}
                  value={inputMessage}
                  onChangeText={setInputMessage}
                  multiline
                />
                <TouchableOpacity 
                  style={[
                    styles.sendButton,
                    { backgroundColor: colors.tint },
                    !inputMessage.trim() && { opacity: 0.5 },
                  ]} 
                  onPress={sendMessage}
                  disabled={!inputMessage.trim()}
                >
                  <Send size={20} color={colors.backgroundElement} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  backBtn: {
    padding: Spacing.one,
    marginRight: Spacing.three,
  },
  chatTitle: {
    flex: 1,
  },
  headerTitle: {
    flex: 1,
  },
  realtimeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  realtimeDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: '#CBD5E1',
  },
  realtimeDotConnected: {
    backgroundColor: '#10B981',
  },
  realtimeDotConnecting: {
    backgroundColor: '#F59E0B',
  },
  realtimeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  scrollContent: {
    padding: Spacing.four,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  chatLastMessage: {
    fontSize: 14,
  },
  messagesContainer: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.three,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  theirMessageText: {
    color: '#000000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: Spacing.two,
    backgroundColor: 'rgba(150,150,150,0.05)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
