import React, { useState } from 'react';
import { StyleSheet, View, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const conversationId = Number(id);
  
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fetch das mensagens
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => conversationsApi.getMessages(conversationId),
    refetchInterval: 3000, // Polling para simular tempo real
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
        <View style={[styles.messageBubble, isUser ? styles.messageBubbleUser : styles.messageBubbleCompany]}>
          
          {item.attachment_url && (
            <Image 
              source={{ uri: item.attachment_url }} 
              style={styles.attachmentImage} 
              contentFit="cover"
            />
          )}

          {item.body ? (
            <ThemedText style={[styles.messageText, isUser && styles.messageTextUser]}>
              {item.body}
            </ThemedText>
          ) : null}

          <View style={styles.messageFooter}>
            <ThemedText style={[styles.messageTime, isUser && styles.messageTimeUser]}>
              {time}
            </ThemedText>
            {isUser && (
              item.isPending ? (
                <Clock size={12} color="#BFDBFE" style={styles.statusIcon} />
              ) : item.read ? (
                <CheckCheck size={12} color="#93C5FD" style={styles.statusIcon} />
              ) : (
                <Check size={12} color="#93C5FD" style={styles.statusIcon} />
              )
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFFFFF' }} />
      
      {/* Header do Chat */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Image 
          source={{ uri: 'https://ui-avatars.com/api/?name=Chat&background=0D8ABC&color=fff' }} 
          style={styles.headerAvatar} 
        />
        <View style={styles.headerInfo}>
          <ThemedText style={styles.companyName}>Comunicação</ThemedText>
          <ThemedText style={styles.onlineStatus}>Online</ThemedText>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#208AEF" />
          </View>
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
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
              <X size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Barra de Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} onPress={handlePickImage}>
            <Paperclip size={20} color="#64748B" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Digite uma mensagem..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, (!inputText.trim() && !selectedImage) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() && !selectedImage}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
    color: '#111827',
  },
  onlineStatus: {
    fontSize: 12,
    color: '#10B981',
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
    backgroundColor: '#208AEF',
    borderBottomRightRadius: 4,
  },
  messageBubbleCompany: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#E2E8F0',
  },
  messageText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  messageTextUser: {
    color: '#FFFFFF',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  messageTimeUser: {
    color: '#BFDBFE',
  },
  statusIcon: {
    marginLeft: 4,
  },
  imagePreviewContainer: {
    padding: Spacing.three,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  attachButton: {
    padding: Spacing.two,
    marginRight: Spacing.one,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 14,
    color: '#111827',
  },
  sendButton: {
    backgroundColor: '#208AEF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.two,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
});
