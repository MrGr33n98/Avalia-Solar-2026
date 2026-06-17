import React, { useState } from 'react';
import { Colors } from '@/constants/theme';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Star, Send, ShieldCheck, QrCode, Camera, X } from 'lucide-react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { companiesApi, reviewsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import * as ImagePicker from 'expo-image-picker';

export default function CompanyRateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // Buscar dados da empresa
  const { data: company, isLoading } = useQuery({
    queryKey: ['company-detail', id],
    queryFn: () => companiesApi.getByIdOrSlug(id!),
    enabled: !!id,
  });

  const createReviewMutation = useMutation({
    mutationFn: (data: { rating: number; title: string; comment: string; reviewer_name: string; images: string[] }) =>
      reviewsApi.create({
        company_id: Number(id),
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        reviewer_name: data.reviewer_name,
        images: data.images,
      }),
    onMutate: async (newReview) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['company-reviews', id] });
      const previousReviews = queryClient.getQueryData(['company-reviews', id]);

      queryClient.setQueryData(['company-reviews', id], (old: any = []) => {
        return [...old, {
          id: Date.now(),
          company_id: Number(id),
          rating: newReview.rating,
          title: newReview.title,
          comment: newReview.comment,
          reviewer_name: newReview.reviewer_name,
          created_at: new Date().toISOString(),
          image_urls: newReview.images,
        }];
      });

      return { previousReviews };
    },
    onError: (err: any, newReview, context) => {
      if (context?.previousReviews) {
        queryClient.setQueryData(['company-reviews', id], context.previousReviews);
      }
      Alert.alert('Erro', err.message || 'Falha ao enviar avaliação. Tente novamente.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['company-reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
    },
    onSuccess: () => {
      Alert.alert('Sucesso', 'Sua avaliação com fotos foi registrada com sucesso!', [
        { text: 'OK', onPress: () => router.replace(`/company/${id}`) }
      ]);
    },
  });

  const handlePickImages = async () => {
    if (images.length >= 3) {
      Alert.alert('Limite', 'Você só pode enviar até 3 fotos da instalação.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 3 - images.length,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets
        .filter(asset => asset.base64)
        .map(asset => `data:image/jpeg;base64,${asset.base64}`);
      
      setImages(prev => [...prev, ...newImages].slice(0, 3));
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRateSubmit = () => {
    if (!comment.trim()) {
      Alert.alert('Erro', 'Por favor, escreva um comentário.');
      return;
    }
    
    // Extrair apenas os base64 brutos para enviar na API
    const base64Images = images.map(img => img.split(',')[1]);

    createReviewMutation.mutate({
      rating,
      title,
      comment,
      reviewer_name: user?.name || 'Cliente via QR Code',
      images: base64Images,
    });
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  const isOwnCompany = user?.role === 'company' && String(user?.id) === id;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.surfaceSubtle }]} onPress={() => router.back()}>
          <ArrowLeft color={colors.backgroundElement} size={24} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
          {isOwnCompany ? 'Seu QR Code' : 'Avaliar Integrador'}
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {isOwnCompany ? (
          <View style={styles.qrContainer}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <QrCode size={40} color={colors.success} />
            </View>
            
            <ThemedText type="subtitle" style={styles.companyName}>
              Obtenha avaliações dos clientes
            </ThemedText>

            <ThemedText style={styles.qrDesc} themeColor="textSecondary">
              Mostre este QR Code exclusivo ao finalizar uma instalação. Ao escanear, seu cliente abrirá esta tela instantaneamente para avaliar o serviço prestado.
            </ThemedText>

            <View style={[styles.qrCodeBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <View style={styles.qrPlaceholder}>
                <QrCode size={180} color={colors.backgroundElement} />
              </View>
            </View>

            <ThemedText style={styles.qrUrlText} themeColor="textSecondary">
              avaliasolar.com.br/rate/{id}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.companyHeader}>
              <ThemedText type="subtitle" style={styles.companyName}>
                {company?.name}
              </ThemedText>
              {company?.verified && (
                <ShieldCheck size={18} color={colors.success} style={{ marginLeft: 6 }} />
              )}
            </View>
            
            <ThemedText style={styles.formSubtitle} themeColor="textSecondary">
              Como foi sua experiência de instalação de energia solar com esta empresa?
            </ThemedText>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Star
                    size={36}
                    color={colors.starYellow}
                    fill={star <= rating ? colors.starYellow : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Título da avaliação (ex: Super recomendo!)"
              placeholderTextColor={colors.textSecondary}
              style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement }]}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              placeholder="Escreva detalhes de sua experiência com o atendimento, prazos e qualidade da instalação..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.textarea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement }]}
              multiline
              numberOfLines={6}
              value={comment}
              onChangeText={setComment}
            />

            {/* Galeria de Fotos */}
            <View style={styles.photosSection}>
              <ThemedText style={styles.sectionTitle}>Fotos da Instalação (Opcional)</ThemedText>
              <ThemedText style={styles.sectionDesc} themeColor="textSecondary">
                Adicione até 3 fotos do sistema instalado.
              </ThemedText>
              
              <View style={styles.photosRow}>
                {images.map((img, idx) => (
                  <View key={idx} style={styles.photoPreviewWrapper}>
                    <Image source={{ uri: img }} style={styles.photoPreview} />
                    <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removeImage(idx)}>
                      <X size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}

                {images.length < 3 && (
                  <TouchableOpacity style={[styles.addPhotoBtn, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]} onPress={handlePickImages}>
                    <Camera size={24} color={colors.tint} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.tint }]}
              onPress={handleRateSubmit}
              disabled={createReviewMutation.isPending}
            >
              {createReviewMutation.isPending ? (
                <ActivityIndicator color={colors.backgroundElement} />
              ) : (
                <>
                  <Send size={16} color={colors.backgroundElement} style={{ marginRight: 8 }} />
                  <ThemedText style={styles.submitButtonText}>Enviar Avaliação</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  content: { flex: 1, padding: 24 },
  qrContainer: { alignItems: 'center', flex: 1, justifyContent: 'center', gap: 16, marginTop: 40 },
  iconWrapper: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  companyName: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  qrDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
  qrCodeBox: { padding: 16, borderRadius: 16, borderWidth: 1, elevation: 4, marginVertical: 16 },
  qrPlaceholder: { padding: 8 },
  qrUrlText: { fontSize: 13, fontWeight: '600' },
  formContainer: { gap: 16 },
  companyHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  formSubtitle: { fontSize: 14, lineHeight: 20 },
  starsRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginVertical: 16 },
  inputField: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 14 },
  textarea: { height: 120, borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 14, textAlignVertical: 'top' },
  photosSection: { marginTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  sectionDesc: { fontSize: 12, marginBottom: 12 },
  photosRow: { flexDirection: 'row', gap: 12 },
  photoPreviewWrapper: { position: 'relative' },
  photoPreview: { width: 80, height: 80, borderRadius: 8, backgroundColor: colors.border },
  removePhotoBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: colors.danger, borderRadius: 10, padding: 4 },
  addPhotoBtn: { width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  submitButton: { height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  submitButtonText: { color: colors.backgroundElement, fontSize: 15, fontWeight: 'bold' },
});
