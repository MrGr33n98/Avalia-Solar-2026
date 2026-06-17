import React, { useState, useEffect, useRef } from 'react';
import { Colors } from '@/constants/theme';
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
import { conversationsApi } from '@/lib/api';
import { createConsumer, Consumer } from '@rails/actioncable';
import { getApiBaseUrl, getStoredToken } from '@/lib/api';

interface Conversation {
  id: number;
  user_id: number;
  company_id: number;
  user_name: string;
  company_name: string;
  last_message?: string;
}

interface Message {
  id: number;
  body: string;
  sender_type: string;
  created_at: string;
}

export default function P2PChatScreen() {
  const { company_id } = useLocalSearchParams<{ company_id?: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const { user } = useAuthStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  
  const cableRef = useRef<Consumer | null>(null);
  const channelRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!user) {
      router.push('/profile');
      return;
    }
    loadConversations();
    
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [user]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await conversationsApi.getAll();
      setConversations(data || []);
      
      if (company_id) {
        let conv = data.find((c: Conversation) => c.company_id === Number(company_id));
        if (!conv) {
          conv = await conversationsApi.create(Number(company_id));
          setConversations((prev) => [conv, ...prev]);
        }
        selectConversation(conv);
      } else if (data.length > 0) {
        selectConversation(data[0]);
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
      const msgs = await conversationsApi.getMessages(conv.id);
      setMessages(msgs || []);
      setupActionCable(conv.id);
    } catch (error) {
      console.error("Erro ao carregar mensagens", error);
    }
  };

  const setupActionCable = async (conversationId: number) => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }
    if (!cableRef.current) {
      const token = await getStoredToken();
      const wsUrl = getApiBaseUrl().replace('http', 'ws').replace('/api/v1', '/cable');
      cableRef.current = createConsumer(`${wsUrl}?token=${token}`);
    }

    channelRef.current = cableRef.current.subscriptions.create(
      { channel: "ConversationChannel", conversation_id: conversationId },
      {
        received: (data: Message) => {
          setMessages((prev) => [...prev, data]);
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
      await conversationsApi.sendMessage(activeConversation.id, msgText);
    } catch (error) {
      console.error("Erro ao enviar mensagem", error);
    }
  };

  if (!user) {
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
                      {user.role === 'company' ? conv.user_name : conv.company_name}
                    </ThemedText>
                    <ThemedText style={styles.chatLastMessage}>
                      {conv.last_message || 'Iniciar conversa...'}
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
            <ThemedText type="subtitle" style={styles.chatTitle}>
              {activeConversation ? (user.role === 'company' ? activeConversation.user_name : activeConversation.company_name) : 'Carregando...'}
            </ThemedText>
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
                  const isMine = (user.role === 'company' && msg.sender_type === 'Company') || 
                                 (user.role !== 'company' && msg.sender_type === 'User');
                  return (
                    <View key={idx} style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage]}>
                      <ThemedText style={[styles.messageText, isMine ? styles.myMessageText : styles.theirMessageText]}>
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
                  style={[styles.sendButton, !inputMessage.trim() && { opacity: 0.5 }]} 
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
    color: colors.textSecondary,
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
    backgroundColor: colors.tint,
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
  myMessageText: {
    color: colors.backgroundElement,
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
    backgroundColor: colors.tint,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
