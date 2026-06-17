import React, { useState } from 'react';
import { Colors } from '@/constants/theme';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, FileText, Upload, Sparkles, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

export default function ScannerScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();

  // Estados de Controle de Fluxo
  const [step, setStep] = useState<'upload' | 'reading' | 'result'>('upload');
  const [readProgress, setReadProgress] = useState(0);
  
  // Dados extraídos confirmados
  const [company, setCompany] = useState('Energisa MT');
  const [consumption, setConsumption] = useState('480');
  const [billValue, setBillValue] = useState('450.00');

  const startScanning = () => {
    setStep('reading');
    setReadProgress(0);
    
    // Simular o progresso do scanner OCR
    const interval = setInterval(() => {
      setReadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStep('result');
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  const handleConfirm = () => {
    // Redireciona para a calculadora solar passando o valor detectado
    router.replace({
      pathname: '/calculadora',
      params: { bill: billValue },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color={colors.text} size={22} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Escanear Conta de Luz</ThemedText>
        </View>

        {/* Passo 1: Upload / Captura */}
        {step === 'upload' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.introContainer}>
              <ThemedText style={styles.introText} themeColor="textSecondary">
                Tire uma foto nítida da sua conta de luz mensal. Nossa IA lerá os dados de consumo para simular seu orçamento sem complicação.
              </ThemedText>
            </View>

            {/* Box de Upload Grande */}
            <TouchableOpacity style={[styles.uploadBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]} onPress={startScanning}>
              <View style={[styles.cameraCircle, { backgroundColor: 'rgba(32, 138, 239, 0.1)' }]}>
                <Camera size={36} color={colors.tint} />
              </View>
              <ThemedText type="subtitle" style={styles.uploadTitle}>Usar Câmera do Celular</ThemedText>
              <ThemedText style={styles.uploadSubtitle} themeColor="textSecondary">
                Posicione a fatura sobre uma superfície iluminada
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.galleryButton, { backgroundColor: colors.backgroundElement }]} onPress={startScanning}>
              <Upload size={18} color={colors.text} />
              <ThemedText style={styles.galleryButtonText}>Selecionar PDF ou Imagem da Galeria</ThemedText>
            </TouchableOpacity>

            {/* Dicas de Captura */}
            <View style={[styles.tipsCard, { backgroundColor: colors.backgroundElement }]}>
              <View style={styles.tipsHeaderRow}>
                <AlertCircle size={16} color={colors.tint} />
                <ThemedText style={styles.tipsTitle}>Dicas para uma boa leitura:</ThemedText>
              </View>
              <ThemedText style={styles.tipText} themeColor="textSecondary">• Evite sombras sobre o papel.</ThemedText>
              <ThemedText style={styles.tipText} themeColor="textSecondary">• Foque no bloco de dados de consumo (kWh) e valores.</ThemedText>
              <ThemedText style={styles.tipText} themeColor="textSecondary">• Deixe o documento reto em relação à câmera.</ThemedText>
            </View>
          </ScrollView>
        )}

        {/* Passo 2: Animação de Scanner OCR */}
        {step === 'reading' && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText type="subtitle" style={styles.readingTitle}>
              Extraindo dados da fatura...
            </ThemedText>
            <View style={[styles.progressBarContainer, { backgroundColor: colors.backgroundSelected }]}>
              <View style={[styles.progressBar, { width: `${readProgress}%`, backgroundColor: colors.tint }]} />
            </View>
            <ThemedText style={styles.progressText}>{readProgress}% concluído</ThemedText>
            
            <View style={styles.scanLineEffect} />
          </View>
        )}

        {/* Passo 3: Exibição dos Dados Detectados */}
        {step === 'result' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.successIntro}>
              <CheckCircle2 size={48} color={colors.success} />
              <ThemedText type="subtitle" style={styles.successTitle}>Leitura concluída!</ThemedText>
              <ThemedText style={styles.successSubtitle} themeColor="textSecondary">
                Verifique se as informações abaixo coincidem com as da sua conta de luz antes de prosseguir.
              </ThemedText>
            </View>

            {/* Formulário de Confirmação */}
            <View style={[styles.formCard, { backgroundColor: colors.backgroundElement }]}>
              
              <View style={styles.formField}>
                <ThemedText style={styles.fieldLabel}>Distribuidora Detectada</ThemedText>
                <View style={[styles.fieldInputWrapper, { backgroundColor: colors.background }]}>
                  <FileText size={16} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.fieldInput, { color: colors.text }]}
                    value={company}
                    onChangeText={setCompany}
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <ThemedText style={styles.fieldLabel}>Consumo Mensal (kWh)</ThemedText>
                <View style={[styles.fieldInputWrapper, { backgroundColor: colors.background }]}>
                  <Sparkles size={16} color={colors.tint} />
                  <TextInput
                    style={[styles.fieldInput, { color: colors.text }]}
                    value={consumption}
                    onChangeText={setConsumption}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <ThemedText style={styles.fieldLabel}>Valor da Fatura (R$)</ThemedText>
                <View style={[styles.fieldInputWrapper, { backgroundColor: colors.background }]}>
                  <ThemedText style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 13 }}>R$</ThemedText>
                  <TextInput
                    style={[styles.fieldInput, { color: colors.text }]}
                    value={billValue}
                    onChangeText={setBillValue}
                    keyboardType="numeric"
                  />
                </View>
              </View>

            </View>

            {/* CTA Final */}
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.tint }]}
              onPress={handleConfirm}
            >
              <ThemedText style={styles.confirmBtnText}>Confirmar e Simular Economia</ThemedText>
              <ChevronRight size={18} color={colors.backgroundElement} style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.retryBtn} onPress={() => setStep('upload')}>
              <ThemedText style={styles.retryBtnText}>Tirar nova foto</ThemedText>
            </TouchableOpacity>

          </ScrollView>
        )}

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
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  backBtn: {
    padding: Spacing.one,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  introContainer: {
    marginBottom: Spacing.four,
  },
  introText: {
    fontSize: 13,
    lineHeight: 18,
  },
  uploadBox: {
    height: 220,
    borderRadius: Spacing.three,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    marginBottom: Spacing.three,
  },
  cameraCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadSubtitle: {
    fontSize: 11,
    marginTop: 4,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  galleryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tipsCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  tipsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  tipText: {
    fontSize: 11,
    lineHeight: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  readingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  scanLineEffect: {
    // Apenas informativo
  },
  successIntro: {
    alignItems: 'center',
    marginVertical: Spacing.four,
    gap: Spacing.one,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  successSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  formCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  formField: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  fieldInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    height: '100%',
  },
  confirmBtn: {
    height: 50,
    borderRadius: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: colors.backgroundElement,
    fontSize: 15,
    fontWeight: 'bold',
  },
  retryBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    marginTop: Spacing.two,
  },
  retryBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
