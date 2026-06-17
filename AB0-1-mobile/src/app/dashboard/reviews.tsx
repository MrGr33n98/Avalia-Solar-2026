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
import { useQuery } from '@tanstack/react-query';
import { reviewsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function DashboardReviewsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();

  const { user } = useAuthStore();

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['company-reviews', user?.company_id],
    queryFn: () => reviewsApi.getByCompany(user?.company_id as number),
    enabled: !!user?.company_id,
  });

  const [localReviews, setLocalReviews] = useState<any[]>([]);

  // Update local state when API data changes
  React.useEffect(() => {
    if (reviewsData) {
      setLocalReviews(reviewsData.map(r => ({ ...r, isReplying: false })));
    }
  }, [reviewsData]);

  const activeReviews = localReviews.length > 0 ? localReviews : [];
  const [activeReplyText, setActiveReplyText] = useState('');

  const toggleReplyInput = (id: string) => {
    setLocalReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isReplying: !r.isReplying } : r))
    );
    setActiveReplyText('');
  };

  const handleSendReply = (id: string) => {
    if (!activeReplyText.trim()) {
      Alert.alert('Erro', 'Por favor, digite uma resposta.');
      return;
    }

    setLocalReviews((prev) =>
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
          <ArrowLeft color={colors.backgroundElement} size={24} />
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
                  <Star key={star} size={14} color={colors.starYellow} fill={colors.starYellow} />
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
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 20 }} />
          ) : activeReviews.length === 0 ? (
            <ThemedText style={{ textAlign: 'center', marginTop: 20 }} themeColor="textSecondary">
              Nenhuma avaliação encontrada.
            </ThemedText>
          ) : activeReviews.map((rev) => (
            <View key={rev.id} style={styles.reviewCard}>
              <View style={styles.cardHeader}>
                <View>
                  <ThemedText style={styles.reviewerName}>{rev.reviewer_name}</ThemedText>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        color={colors.starYellow}
                        fill={s <= rev.rating ? colors.starYellow : 'transparent'}
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
                <View style={[styles.replyBox, { backgroundColor: colors.surfaceSubtle }]}>
                  <View style={styles.replyHeader}>
                    <MessageCircle size={14} color={colors.brandDarkBlue} style={{ marginRight: 6 }} />
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
                  <MessageCircle size={14} color={colors.tint} style={{ marginRight: 6 }} />
                  <ThemedText style={styles.replyTriggerText}>Responder cliente</ThemedText>
                </TouchableOpacity>
              )}

              {/* Campo para Digitar Resposta */}
              {rev.isReplying && (
                <View style={styles.replyInputContainer}>
                  <TextInput
                    placeholder="Digite sua resposta pública para o cliente..."
                    placeholderTextColor={colors.textSecondary}
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
                      style={[styles.sendBtn, { backgroundColor: colors.tint }]}
                      onPress={() => handleSendReply(rev.id)}
                    >
                      <Send size={12} color={colors.backgroundElement} style={{ marginRight: 6 }} />
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.backgroundElement,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.backgroundElement,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryBox: {
    backgroundColor: colors.backgroundElement,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
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
    color: colors.brandDarkBlue,
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
    backgroundColor: colors.backgroundElement,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.backgroundElement,
  },
  dateText: {
    fontSize: 11,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.backgroundElement,
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
    color: colors.brandDarkBlue,
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
    color: colors.tint,
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
    backgroundColor: colors.background,
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
    color: colors.textSecondary,
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
    color: colors.backgroundElement,
    fontSize: 12,
    fontWeight: '700',
  },
});
