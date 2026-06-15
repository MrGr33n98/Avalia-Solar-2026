import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, Phone, Info } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

interface Message {
  id: number;
  text: string;
  sender: 'me' | 'them';
  time: string;
}

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  // Nome mockado da empresa baseado no ID
  const companyName = id === '1' ? 'EcoVolt Engenharia' : 'Solar SP Distribuidora';

  // Mensagens mockadas da conversa
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Olá! Vimos seu interesse em energia solar para seu imóvel.',
      sender: 'them',
      time: '14:20',
    },
    {
      id: 2,
      text: 'Olá! Gostaria de entender o valor da instalação e a potência ideal.',
      sender: 'me',
      time: '14:22',
    },
    {
      id: 3,
      text: 'Perfeito. Recebemos sua simulação da fatura e o projeto residencial está pronto. Ficou estimado em R$ 12.500,00 com 8 placas. A economia estimada é de R$ 390 por mês.',
      sender: 'them',
      time: '14:25',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMsg: Message = {
      id: messages.length + 1,
      text: inputMessage.trim(),
      sender: 'me',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');
    
    // Auto Scroll para a última mensagem
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft color={colors.text} size={22} />
            </TouchableOpacity>
            <View>
              <ThemedText style={styles.companyName}>{companyName}</ThemedText>
              <ThemedText style={styles.onlineStatus} themeColor="textSecondary">online</ThemedText>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.actionIcon} onPress={() => router.push(`/company/${id}`)}>
              <Info size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
          >
            {messages.map((msg) => {
              const isMe = msg.sender === 'me';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    isMe ? styles.messageRowRight : styles.messageRowLeft
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isMe 
                        ? [styles.bubbleRight, { backgroundColor: '#208AEF' }] 
                        : [styles.bubbleLeft, { backgroundColor: colors.backgroundElement }]
                    ]}
                  >
                    <ThemedText
                      style={[styles.messageText, isMe && { color: '#ffffff' }]}
                    >
                      {msg.text}
                    </ThemedText>
                    <ThemedText
                      style={[styles.messageTime, isMe ? { color: 'rgba(255,255,255,0.7)' } : { color: '#8E8E93' }]}
                    >
                      {msg.time}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Input Row */}
          <View style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <TextInput
              placeholder="Digite sua mensagem..."
              placeholderTextColor="#8E8E93"
              style={[styles.textInput, { color: colors.text, backgroundColor: colors.backgroundElement }]}
              value={inputMessage}
              onChangeText={setInputMessage}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: '#208AEF' }]}
              onPress={handleSendMessage}
            >
              <Send size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 142, 147, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  backBtn: {
    padding: Spacing.one,
  },
  companyName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  onlineStatus: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  actionIcon: {
    padding: Spacing.one,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: 2,
  },
  bubbleLeft: {
    borderTopLeftRadius: 4,
  },
  bubbleRight: {
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  messageTime: {
    fontSize: 9,
    alignSelf: 'flex-end',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
    gap: Spacing.three,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    maxHeight: 100,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
