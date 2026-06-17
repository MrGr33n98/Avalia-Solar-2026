import React, { useState } from 'react';
import { Colors } from '@/constants/theme';
import { StyleSheet, View, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } , useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Paperclip, Check, CheckCheck, Clock, X } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationsApi, Message } from '@/lib/api';
import * as ImagePicker from 'expo-image-picker';

type OptimisticMessage = Message & { isPending?: boolean };

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const queryClient = useQueryClient();
  const conversationId = Number(id);
  
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fetch das mensagens
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => conversationsApi.getMessages(conversationId),
  });

  // Conectar ao ActionCable para tempo real
  useActionCable({
    channel: 'ConversationChannel',
    params: { conversation_id: conversationId },
    onReceived: (data) => {
      // Atualiza o cache do React Query com a nova mensagem
      queryClient.setQueryData<Message[]>(['messages', conversationId], (old = []) => {
        // Evita duplicatas se a mensagem for a mesma que enviamos via optimistic update
        if (old.some(m => m.id === data.id)) return old;
        return [...old, data];
      });
    },
  });

  // Mutação com Optimistic Update
  const sendMessageMutation = useMutation({
    mutationFn: (newMsg: { text: string; imageBase64?: string }) => {
      return conversationsApi.sendMessage(conversationId, newMsg.text, newMsg.imageBase64);
    },
    onMutate: async (newMsg) => {
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', conversationId]);

      const optimisticMsg: OptimisticMessage = {
        id: Date.now(), // ID temporário
        body: newMsg.text,
        sender_type: 'User', // Assumindo que o app mobile é o usuário
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        conversation_id: conversationId,
        attachment_url: selectedImage || undefined,
        isPending: true,
      };

      queryClient.setQueryData<OptimisticMessage[]>(['messages', conversationId], (old = []) => {
        return [...old, optimisticMsg];
      });

      return { previousMessages };
    },
    onError: (err, newMsg, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', conversationId], context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5, // Comprimir imagem
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSelectedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const sendMessage = () => {
    if (!inputText.trim() && !selectedImage) return;
    
    // Extrair apenas o base64 para a API, se houver
    const base64Data = selectedImage ? selectedImage.split(',')[1] : undefined;

    sendMessageMutation.mutate({ text: inputText, imageBase64: base64Data });
    setInputText('');
    setSelectedImage(null);
  };

  const renderMessage = ({ item }: { item: OptimisticMessage }) => {
    const isUser = item.sender_type === 'User';
    
    // Formatar hora (ex: 10:30)
    const time = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperRight : styles.messageWrapperLeft]}>
        <View style={[
          styles.messageBubble, 
          isUser ? [styles.messageBubbleUser, { backgroundColor: colors.brandBlue }] : [styles.messageBubbleCompany, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]
        ]}>
          
          {item.attachment_url && (
            <Image 
              source={{ uri: item.attachment_url }} 
              style={styles.attachmentImage} 
              contentFit="cover"
            />
          )}

          {item.body ? (
            <ThemedText style={[styles.messageText, isUser ? styles.messageTextUser : { color: colors.text }]}>
              {item.body}
            </ThemedText>
          ) : null}

          <View style={styles.messageFooter}>
            <ThemedText style={[styles.messageTime, isUser ? styles.messageTimeUser : { color: colors.textSecondary }]}>
              {time}
            </ThemedText>
            {isUser && (
              item.isPending ? (
                <Clock size={12} color={colors.background} style={styles.statusIcon} />
              ) : item.read ? (
                <CheckCheck size={12} color={colors.background} style={styles.statusIcon} />
              ) : (
                <Check size={12} color={colors.background} style={styles.statusIcon} />
              )
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }} />
      
      {/* Header do Chat */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Image 
          source={{ uri: 'https://ui-avatars.com/api/?name=Chat&background=0D8ABC&color=fff' }} 
          style={styles.headerAvatar} 
        />
        <View style={styles.headerInfo}>
          <ThemedText style={[styles.companyName, { color: colors.text }]}>Comunicação</ThemedText>
          <ThemedText style={[styles.onlineStatus, { color: colors.success }]}>Online</ThemedText>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isLoading ? (
          <MessageSkeleton />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.chatList}
          />
        )}

        {/* Preview da Imagem Selecionada */}
        {selectedImage && (
          <View style={[styles.imagePreviewContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
              <X size={16} color={colors.backgroundElement} />
            </TouchableOpacity>
          </View>
        )}

        {/* Barra de Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.attachButton} onPress={handlePickImage}>
            <Paperclip size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.backgroundSelected, color: colors.text }]}
            placeholder="Digite uma mensagem..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              { backgroundColor: colors.brandBlue },
              (!inputText.trim() && !selectedImage) && { backgroundColor: colors.textSecondary }
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() && !selectedImage}
          >
            <Send size={18} color={colors.backgroundElement} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.one,
    marginRight: Spacing.two,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.three,
  },
  headerInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  onlineStatus: {
    fontSize: 12,
    color: colors.success,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatList: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  messageWrapper: {
    marginBottom: Spacing.three,
    flexDirection: 'row',
  },
  messageWrapperLeft: {
    justifyContent: 'flex-start',
  },
  messageWrapperRight: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: 16,
  },
  messageBubbleUser: {
    backgroundColor: colors.tint,
    borderBottomRightRadius: 4,
  },
  messageBubbleCompany: {
    backgroundColor: colors.backgroundElement,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.border,
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  messageTextUser: {
    color: colors.backgroundElement,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  messageTimeUser: {
    color: '#BFDBFE',
  },
  statusIcon: {
    marginLeft: 4,
  },
  imagePreviewContainer: {
    padding: Spacing.three,
    backgroundColor: colors.backgroundElement,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageBtn: {
    position: 'absolute',
    top: Spacing.two,
    left: 80,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    backgroundColor: colors.backgroundElement,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachButton: {
    padding: Spacing.two,
    marginRight: Spacing.one,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 14,
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.tint,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.two,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
});
