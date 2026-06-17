import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Star, Send, MessageCircle } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';

export default function DashboardReviewsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();

  // Mock de avaliações recebidas
  const [reviews, setReviews] = useState([
    {
      id: '1',
      reviewer_name: 'Mariana Silva',
      rating: 5,
      title: 'Excelente serviço!',
      comment: 'Equipe muito qualificada e instalação rápida. Super recomendo o trabalho deles!',
      created_at: '2 dias atrás',
      reply: '',
      isReplying: false,
    },
    {
      id: '2',
      reviewer_name: 'José Santos',
      rating: 4,
      title: 'Bom atendimento',
      comment: 'O atendimento foi muito prestativo e o preço justo. Apenas atrasou um dia a entrega dos painéis.',
      created_at: '5 dias atrás',
      reply: 'Agradecemos o feedback, José! Trabalhamos para refinar nossa logística cada vez mais.',
      isReplying: false,
    }
  ]);

  const [activeReplyText, setActiveReplyText] = useState('');

  const toggleReplyInput = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isReplying: !r.isReplying } : r))
    );
    setActiveReplyText('');
  };

  const handleSendReply = (id: string) => {
    if (!activeReplyText.trim()) {
      Alert.alert('Erro', 'Por favor, digite uma resposta.');
      return;
    }

    setReviews((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, reply: activeReplyText, isReplying: false } : r
      )
    );
    Alert.alert('Sucesso', 'Sua resposta foi enviada com sucesso!');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#1E293B" size={24} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Minhas Avaliações</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Distribuição de Notas Simplificada */}
        <View style={styles.summaryBox}>
          <ThemedText style={styles.summaryTitle}>Média Global</ThemedText>
          <View style={styles.scoreRow}>
            <ThemedText style={styles.scoreNumber}>4.9</ThemedText>
            <View style={styles.starsBox}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={14} color="#F59E0B" fill="#F59E0B" />
                ))}
              </View>
              <ThemedText style={styles.reviewsCountText} themeColor="textSecondary">
                Baseado em 128 avaliações
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Lista de Avaliações */}
        <View style={styles.reviewsList}>
          {reviews.map((rev) => (
            <View key={rev.id} style={styles.reviewCard}>
              <View style={styles.cardHeader}>
                <View>
                  <ThemedText style={styles.reviewerName}>{rev.reviewer_name}</ThemedText>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        color="#F59E0B"
                        fill={s <= rev.rating ? '#F59E0B' : 'transparent'}
                      />
                    ))}
                  </View>
                </View>
                <ThemedText style={styles.dateText} themeColor="textSecondary">
                  {rev.created_at}
                </ThemedText>
              </View>

              <ThemedText style={styles.reviewTitle}>{rev.title}</ThemedText>
              <ThemedText style={styles.reviewComment} themeColor="textSecondary">
                "{rev.comment}"
              </ThemedText>

              {/* Exibe resposta se houver */}
              {rev.reply ? (
                <View style={[styles.replyBox, { backgroundColor: '#F1F5F9' }]}>
                  <View style={styles.replyHeader}>
                    <MessageCircle size={14} color="#003E7E" style={{ marginRight: 6 }} />
                    <ThemedText style={styles.replyTitleText}>Sua Resposta:</ThemedText>
                  </View>
                  <ThemedText style={styles.replyText} themeColor="textSecondary">
                    {rev.reply}
                  </ThemedText>
                </View>
              ) : null}

              {/* Botão de Responder */}
              {!rev.reply && !rev.isReplying && (
                <TouchableOpacity
                  style={styles.replyTrigger}
                  onPress={() => toggleReplyInput(rev.id)}
                >
                  <MessageCircle size={14} color="#208AEF" style={{ marginRight: 6 }} />
                  <ThemedText style={styles.replyTriggerText}>Responder cliente</ThemedText>
                </TouchableOpacity>
              )}

              {/* Campo para Digitar Resposta */}
              {rev.isReplying && (
                <View style={styles.replyInputContainer}>
                  <TextInput
                    placeholder="Digite sua resposta pública para o cliente..."
                    placeholderTextColor="#8E8E93"
                    style={[styles.replyInput, { color: colors.text, borderColor: colors.border }]}
                    value={activeReplyText}
                    onChangeText={setActiveReplyText}
                    multiline
                  />
                  <View style={styles.replyFormActions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => toggleReplyInput(rev.id)}
                    >
                      <ThemedText style={styles.cancelBtnText}>Cancelar</ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.sendBtn, { backgroundColor: '#208AEF' }]}
                      onPress={() => handleSendReply(rev.id)}
                    >
                      <Send size={12} color="#ffffff" style={{ marginRight: 6 }} />
                      <ThemedText style={styles.sendBtnText}>Enviar</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
  },
  starsBox: {
    justifyContent: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewsCountText: {
    fontSize: 11,
    marginTop: 4,
  },
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  dateText: {
    fontSize: 11,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginVertical: 4,
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  replyBox: {
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyTitleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#003E7E',
  },
  replyText: {
    fontSize: 12,
    lineHeight: 16,
  },
  replyTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  replyTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#208AEF',
  },
  replyInputContainer: {
    marginTop: 12,
    gap: 8,
  },
  replyInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    height: 60,
    textAlignVertical: 'top',
    backgroundColor: '#F8FAFC',
  },
  replyFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
