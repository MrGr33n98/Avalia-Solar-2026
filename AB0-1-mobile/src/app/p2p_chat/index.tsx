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
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MessageCircle, ArrowLeft, Send, Paperclip, CheckCheck, Ban, Flag } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';
import { conversationsApi, type Conversation, type Message } from '@/lib/api';
import { createConsumer, Consumer } from '@rails/actioncable';
import { getApiBaseUrl, getStoredToken } from '@/lib/api';

type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'rejected';
type PendingAttachment = {
  data: string;
  filename: string;
  content_type: string;
};
type ChatCablePayload = Partial<Message> & {
  event?: string;
  conversation_id?: number;
  message?: Message;
  conversation?: Conversation;
  reader_type?: 'User' | 'Company';
  read_at?: string;
  message_ids?: number[];
  actor_type?: 'User' | 'Company';
};

function getRealtimeLabel(status: RealtimeStatus) {
  if (status === 'connected') return 'ao vivo';
  if (status === 'connecting') return 'conectando';
  if (status === 'disconnected') return 'reconectando';
  if (status === 'rejected') return 'offline';
  return 'aguardando';
}

export default function P2PChatScreen() {
  const { company_id, conversation_id } = useLocalSearchParams<{ company_id?: string; conversation_id?: string }>();
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
  const [typingByCompany, setTypingByCompany] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  
  const cableRef = useRef<Consumer | null>(null);
  const channelRef = useRef<any>(null);
  const listChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      if (listChannelRef.current) {
        listChannelRef.current.unsubscribe();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [canUseP2PChat, company_id, conversation_id, user?.id]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await conversationsApi.getAll();
      const list = data || [];
      setConversations(list);
      setupConversationListCable();
      
      if (conversation_id) {
        const conv = list.find((c) => c.id === Number(conversation_id));
        if (conv) selectConversation(conv);
      } else if (company_id) {
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

  const upsertConversation = (conversation: Conversation) => {
    setConversations((prev) => {
      const next = prev.some((item) => item.id === conversation.id)
        ? prev.map((item) => (item.id === conversation.id ? { ...item, ...conversation } : item))
        : [conversation, ...prev];

      return [...next].sort((a, b) => {
        const dateA = new Date(a.last_message_at || a.updated_at || '').getTime();
        const dateB = new Date(b.last_message_at || b.updated_at || '').getTime();
        return dateB - dateA;
      });
    });

    setActiveConversation((current) =>
      current?.id === conversation.id ? { ...current, ...conversation } : current
    );
  };

  const appendMessage = (message: Message) => {
    setMessages((prev) => {
      if (prev.some((item) => item.id === message.id || (message.client_message_id && item.client_message_id === message.client_message_id))) return prev;
      return [...prev, message];
    });
  };

  const applyReadReceipt = (payload: ChatCablePayload) => {
    if (!payload.read_at) return;

    setMessages((prev) =>
      prev.map((message) => {
        const matchesExplicitId = payload.message_ids?.includes(message.id);
        const matchesReaderSide =
          payload.reader_type === 'Company' && message.sender_type === 'User';

        return matchesExplicitId || matchesReaderSide
          ? { ...message, read_at: message.read_at || payload.read_at || null }
          : message;
      })
    );
  };

  const handleRealtimePayload = (payload: ChatCablePayload) => {
    if (payload.conversation) upsertConversation(payload.conversation);

    if (payload.event === 'message.created' && payload.message) {
      appendMessage(payload.message);
      setTypingByCompany(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      return;
    }

    if (payload.event === 'message.read') {
      applyReadReceipt(payload);
      return;
    }

    if (payload.event === 'typing.started' && payload.actor_type === 'Company') {
      setTypingByCompany(true);
      return;
    }

    if (payload.event === 'typing.stopped' && payload.actor_type === 'Company') {
      setTypingByCompany(false);
      return;
    }

    if (!payload.event && payload.id) {
      appendMessage(payload as Message);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const setupConversationListCable = async () => {
    if (listChannelRef.current) {
      listChannelRef.current.unsubscribe();
    }

    if (!cableRef.current) {
      const token = await getStoredToken();
      const wsUrl = getApiBaseUrl().replace('http', 'ws').replace('/api/v1', '/cable');
      cableRef.current = createConsumer(`${wsUrl}?token=${token}`);
    }

    listChannelRef.current = cableRef.current.subscriptions.create(
      { channel: 'ConversationListChannel' },
      {
        received: (payload: ChatCablePayload) => {
          if (payload.conversation) upsertConversation(payload.conversation);
        },
      }
    );
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
        received: (data: ChatCablePayload) => {
          handleRealtimePayload(data);
        }
      }
    );
  };

  const sendMessage = async () => {
    if ((!inputMessage.trim() && !pendingAttachment) || !activeConversation) return;
    if (activeConversation.status === 'blocked') {
      Alert.alert('Conversa bloqueada', 'Não é possível enviar novas mensagens nesta conversa.');
      return;
    }

    try {
      const msgText = inputMessage;
      const attachment = pendingAttachment;
      setInputMessage("");
      setPendingAttachment(null);
      channelRef.current?.perform?.('typing', { typing: false });
      const clientMessageId = `mobile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const sentMessage = await conversationsApi.sendMessage(activeConversation.id, msgText, undefined, {
        client_message_id: clientMessageId,
        attachments: attachment ? [attachment] : undefined,
        client: 'mobile',
      });
      appendMessage(sentMessage);
    } catch (error) {
      console.error("Erro ao enviar mensagem", error);
    }
  };

  const handleInputChange = (value: string) => {
    setInputMessage(value);
    if (!activeConversation || realtimeStatus !== 'connected') return;

    channelRef.current?.perform?.('typing', { typing: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.perform?.('typing', { typing: false });
    }, 1200);
  };

  const pickAttachment = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (asset.size && asset.size > 10 * 1024 * 1024) {
      Alert.alert('Anexo muito grande', 'Envie arquivos de até 10MB.');
      return;
    }

    const contentType = asset.mimeType || 'application/octet-stream';
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(contentType)) {
      Alert.alert('Formato inválido', 'Envie apenas imagem ou PDF.');
      return;
    }

    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    setPendingAttachment({
      data: `data:${contentType};base64,${base64}`,
      filename: asset.name || 'anexo',
      content_type: contentType,
    });
  };

  const blockConversation = () => {
    if (!activeConversation) return;
    Alert.alert('Bloquear conversa', 'Você não receberá novas mensagens nesta conversa.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Bloquear',
        style: 'destructive',
        onPress: async () => {
          const updated = await conversationsApi.block(activeConversation.id, 'Bloqueado pelo app mobile');
          upsertConversation(updated);
        },
      },
    ]);
  };

  const reportConversation = () => {
    if (!activeConversation) return;
    Alert.alert('Denunciar conversa', 'A denúncia será registrada no histórico auditável.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Denunciar',
        style: 'destructive',
        onPress: async () => {
          const result = await conversationsApi.report(activeConversation.id, 'other', 'Denúncia enviada pelo app mobile');
          upsertConversation(result.conversation);
        },
      },
    ]);
  };

  if (!user || !canUseP2PChat) {
    return <ThemedView style={styles.container}><ActivityIndicator color={colors.tint} style={{marginTop: 50}} /></ThemedView>;
  }

  // Se não tem conversa ativa e não tem company_id, mostra lista de conversas
  if (!activeConversation && !company_id && !conversation_id) {
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
                  {(conv.unread_count || 0) > 0 && (
                    <View style={styles.unreadBadge}>
                      <ThemedText style={styles.unreadBadgeText}>
                        {(conv.unread_count || 0) > 9 ? '9+' : conv.unread_count}
                      </ThemedText>
                    </View>
                  )}
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
                {typingByCompany && (
                  <ThemedText style={[styles.realtimeLabel, { color: colors.tint }]}>
                    empresa digitando
                  </ThemedText>
                )}
              </View>
            </View>
            {activeConversation && (
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerIconBtn} onPress={reportConversation}>
                  <Flag color={colors.textSecondary} size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerIconBtn}
                  onPress={blockConversation}
                  disabled={activeConversation.status === 'blocked'}
                >
                  <Ban color={activeConversation.status === 'blocked' ? colors.textSecondary : colors.danger} size={18} />
                </TouchableOpacity>
              </View>
            )}
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
                      {(msg.attachments || []).map((attachment) => (
                        <TouchableOpacity
                          key={attachment.id}
                          style={[
                            styles.attachmentChip,
                            isMine ? styles.myAttachmentChip : styles.theirAttachmentChip,
                          ]}
                          onPress={() => attachment.url && Linking.openURL(attachment.url)}
                        >
                          <Paperclip
                            size={14}
                            color={isMine ? colors.backgroundElement : colors.tint}
                          />
                          <ThemedText
                            numberOfLines={1}
                            style={[
                              styles.attachmentText,
                              isMine ? { color: colors.backgroundElement } : { color: colors.text },
                            ]}
                          >
                            {attachment.filename}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                      {isMine && (
                        <View style={styles.receiptRow}>
                          <CheckCheck size={12} color={colors.backgroundElement} />
                          <ThemedText style={styles.receiptText}>
                            {msg.read_at ? 'Lida' : msg.delivered_at ? 'Entregue' : 'Enviando'}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  );
                })}
                {activeConversation?.status === 'blocked' && (
                  <View style={styles.blockedBanner}>
                    <ThemedText style={styles.blockedText}>
                      Esta conversa está bloqueada.
                    </ThemedText>
                  </View>
                )}
              </ScrollView>
              
              <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                {pendingAttachment && (
                  <View style={styles.pendingAttachment}>
                    <ThemedText numberOfLines={1} style={styles.pendingAttachmentText}>
                      {pendingAttachment.filename}
                    </ThemedText>
                    <TouchableOpacity onPress={() => setPendingAttachment(null)}>
                      <ThemedText style={styles.removeAttachment}>Remover</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.attachButton, { borderColor: colors.backgroundSelected }]}
                  onPress={pickAttachment}
                  disabled={activeConversation?.status === 'blocked'}
                >
                  <Paperclip size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  placeholder="Mensagem..."
                  placeholderTextColor={colors.textSecondary}
                  value={inputMessage}
                  onChangeText={handleInputChange}
                  multiline
                  editable={activeConversation?.status !== 'blocked'}
                />
                <TouchableOpacity 
                  style={[
                    styles.sendButton,
                    { backgroundColor: colors.tint },
                    (!inputMessage.trim() && !pendingAttachment) && { opacity: 0.5 },
                  ]} 
                  onPress={sendMessage}
                  disabled={(!inputMessage.trim() && !pendingAttachment) || activeConversation?.status === 'blocked'}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(150,150,150,0.08)',
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
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    marginLeft: Spacing.two,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
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
  attachmentChip: {
    marginTop: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    maxWidth: 220,
  },
  myAttachmentChip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  theirAttachmentChip: {
    backgroundColor: 'rgba(32,138,239,0.08)',
  },
  attachmentText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  receiptRow: {
    marginTop: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  receiptText: {
    color: '#FFFFFF',
    opacity: 0.85,
    fontSize: 10,
    fontWeight: '700',
  },
  blockedBanner: {
    alignSelf: 'center',
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  blockedText: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 12,
  },
  theirMessageText: {
    color: '#000000',
  },
  inputContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
    alignItems: 'flex-end',
  },
  pendingAttachment: {
    width: '100%',
    marginBottom: Spacing.two,
    borderRadius: 12,
    backgroundColor: 'rgba(32,138,239,0.08)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  pendingAttachmentText: {
    flex: 1,
    fontWeight: '700',
    fontSize: 12,
  },
  removeAttachment: {
    color: '#B91C1C',
    fontWeight: '800',
    fontSize: 12,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.two,
    backgroundColor: 'rgba(150,150,150,0.05)',
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
