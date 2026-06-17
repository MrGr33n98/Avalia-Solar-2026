import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Share, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Share2, Info } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function QrGeneratorScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [userCompany, setUserCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompany() {
      try {
        if (user?.company_id) {
          const res = await fetchApi<{ company: any }>(`companies/${user.company_id}`);
          if (res && res.company) {
            setUserCompany(res.company);
          }
        } else {
          const companies = await fetchApi<any[]>('companies/mine');
          if (companies && companies.length > 0) {
            const res = await fetchApi<{ company: any }>(`companies/${companies[0].id}`);
            if (res && res.company) {
              setUserCompany(res.company);
            }
          }
        }
      } catch (error) {
        console.error('[QR Generator] Erro ao carregar empresa:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCompany();
  }, [user]);

  const slug = userCompany?.slug || 'empresa';
  const qrValue = `https://avaliasolar.com.br/review/${slug}?source=qr_code`;
  const qrImageUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(qrValue)}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Por favor, avalie a instalação feita pela ${userCompany?.name || 'nossa empresa'} no portal Avalia Solar: ${qrValue}`,
      });
    } catch (error) {
      console.log('Error sharing', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#003E7E" />
        <ThemedText style={{ marginTop: 12 }}>Carregando dados do QR Code...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFFFFF' }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Gerador de QR Code</ThemedText>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Share2 size={24} color="#208AEF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.qrCard}>
          <ThemedText style={styles.qrTitle}>Avalie a {userCompany?.name || 'Empresa'}</ThemedText>
          <ThemedText style={styles.qrSubtitle}>Escaneie com a câmera do celular</ThemedText>
          
          <View style={styles.qrCodeWrapper}>
            <Image
              source={{ uri: qrImageUrl }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Info size={20} color="#2563EB" style={{ marginRight: 12, marginTop: 2 }} />
          <ThemedText style={styles.infoText}>
            Apresente esta tela para o seu cliente ao finalizar a instalação. Avaliações captadas via QR Code recebem o selo "Visita Confirmada" e aumentam a reputação do seu perfil.
          </ThemedText>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleShare}>
          <ThemedText style={styles.primaryButtonText}>Compartilhar Link de Avaliação</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: Spacing.one,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  shareButton: {
    padding: Spacing.one,
  },
  content: {
    flex: 1,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.five,
    alignItems: 'center',
    width: '100%',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    marginBottom: Spacing.five,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  qrSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: Spacing.five,
    textAlign: 'center',
  },
  qrCodeWrapper: {
    padding: Spacing.two,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    padding: Spacing.four,
    borderRadius: 12,
    marginBottom: Spacing.five,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: '#208AEF',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#208AEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
