import React, { useState } from 'react';
import { Colors } from '@/constants/theme';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Sun, Landmark, ShieldCheck, Zap, Layers, RefreshCw, ChevronRight } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

// Média aproximada de custo por kWh em cada estado (em R$)
const KWH_PRICES: Record<string, number> = {
  MT: 0.92,
  SP: 0.86,
  RJ: 0.94,
  MG: 0.91,
  PR: 0.82,
  SC: 0.80,
  RS: 0.84,
  BA: 0.89,
  PE: 0.88,
  CE: 0.87,
  DF: 0.81,
};

export default function CalculadoraScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();

  // Estados dos inputs
  const [billValue, setBillValue] = useState(450); // Valor padrão de R$ 450,00
  const [selectedState, setSelectedState] = useState('MT'); // Default MT conforme a imagem
  const [showStatesDropdown, setShowStatesDropdown] = useState(false);

  // Lógica de Cálculo
  const kwhPrice = KWH_PRICES[selectedState] || 0.85;
  const consumptionKwh = billValue / kwhPrice;
  
  // Cálculo de potência do sistema (kWp)
  // Consumo_kWh / (HSP * 30 * rendimento) -> HSP média de 4.8 e rendimento de 80%
  const systemSizeKwp = consumptionKwh / (4.8 * 30 * 0.8);
  
  // Placas de 550W (0.55 kWp)
  const panelCount = Math.ceil(systemSizeKwp / 0.55);
  
  // Área necessária (cada painel tem aproximadamente 2.2 m²)
  const areaNeeded = panelCount * 2.2;
  
  // Estimativa do custo de instalação/projeto
  let estimatedCost = 0;
  if (panelCount <= 4) {
    estimatedCost = 6500 + panelCount * 800;
  } else if (panelCount <= 8) {
    estimatedCost = 9000 + panelCount * 700;
  } else {
    estimatedCost = 13000 + panelCount * 650;
  }

  // Economia mensal estimada (geralmente economiza 95% do consumo)
  const monthlySavings = billValue * 0.95;
  const annualSavings = monthlySavings * 12;

  // Tempo de retorno (Payback em anos)
  const paybackYears = estimatedCost / annualSavings;
  const paybackMonths = Math.round((paybackYears % 1) * 12);

  const handleRequestQuotes = () => {
    // Redireciona para exploração com a categoria de Energia Solar pré-filtrada
    router.push({
      pathname: '/explore',
      params: { q: 'Energia Solar', category_id: '1' },
    });
  };

  const adjustBill = (amount: number) => {
    setBillValue(prev => Math.max(100, Math.min(5000, prev + amount)));
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color={colors.text} size={22} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Calculadora Solar</ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Introdução */}
          <View style={styles.introCard}>
            <ThemedText style={styles.introText}>
              Descubra o tamanho ideal do seu sistema de energia solar e a estimativa de economia em poucos segundos.
            </ThemedText>
          </View>

          {/* Form de Inputs */}
          <View style={[styles.inputCard, { backgroundColor: colors.backgroundElement }]}>
            
            {/* Seletor de Estado */}
            <View style={styles.stateSelectorRow}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Seu Estado:</ThemedText>
              <TouchableOpacity
                style={[styles.stateBtn, { backgroundColor: colors.backgroundSelected }]}
                onPress={() => setShowStatesDropdown(!showStatesDropdown)}
              >
                <ThemedText style={styles.stateBtnText}>{selectedState}</ThemedText>
                <ChevronRight size={16} color={colors.textSecondary} style={{ transform: [{ rotate: showStatesDropdown ? '90deg' : '0deg' }] }} />
              </TouchableOpacity>
            </View>

            {showStatesDropdown && (
              <View style={[styles.dropdown, { backgroundColor: colors.backgroundSelected, borderColor: colors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dropdownContent}>
                  {Object.keys(KWH_PRICES).map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.dropdownItem, selectedState === st && { backgroundColor: colors.brandActiveBlue + '20' }]}
                      onPress={() => {
                        setSelectedState(st);
                        setShowStatesDropdown(false);
                      }}
                    >
                      <ThemedText style={[styles.dropdownItemText, selectedState === st && { color: colors.brandActiveBlue, fontWeight: 'bold' }]}>
                        {st}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Seletor de Valor da Conta */}
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Valor médio da conta de luz:</ThemedText>
            <ThemedText style={[styles.billValueDisplay, { color: colors.brandActiveBlue }]}>
              R$ {billValue.toFixed(2)}
            </ThemedText>

            {/* Controles do Valor da Conta */}
            <View style={styles.billControls}>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: colors.backgroundSelected }]} onPress={() => adjustBill(-100)}>
                <ThemedText style={[styles.controlBtnText, { color: colors.text }]}>-100</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: colors.backgroundSelected }]} onPress={() => adjustBill(-50)}>
                <ThemedText style={[styles.controlBtnText, { color: colors.text }]}>-50</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: colors.backgroundSelected }]} onPress={() => adjustBill(50)}>
                <ThemedText style={[styles.controlBtnText, { color: colors.text }]}>+50</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: colors.backgroundSelected }]} onPress={() => adjustBill(100)}>
                <ThemedText style={[styles.controlBtnText, { color: colors.text }]}>+100</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Resultados da Simulação */}
          <ThemedText type="subtitle" style={styles.resultsHeader}>Seu Sistema Estimado</ThemedText>
          
          <View style={[styles.resultsGrid]}>
            {/* Card Placas */}
            <View style={[styles.resultCard, { backgroundColor: colors.backgroundElement }]}>
              <Layers size={22} color={colors.brandActiveBlue} />
              <ThemedText style={[styles.resultValue, { color: colors.text }]}>{panelCount} placas</ThemedText>
              <ThemedText style={[styles.resultLabel, { color: colors.textSecondary }]}>Qtd. de painéis (550W)</ThemedText>
            </View>

            {/* Card Área */}
            <View style={[styles.resultCard, { backgroundColor: colors.backgroundElement }]}>
              <Sun size={22} color={colors.success} />
              <ThemedText style={[styles.resultValue, { color: colors.text }]}>{areaNeeded.toFixed(1)} m²</ThemedText>
              <ThemedText style={[styles.resultLabel, { color: colors.textSecondary }]}>Área de telhado mínima</ThemedText>
            </View>

            {/* Card Potência */}
            <View style={[styles.resultCard, { backgroundColor: colors.backgroundElement }]}>
              <Zap size={22} color={colors.starYellow} />
              <ThemedText style={[styles.resultValue, { color: colors.text }]}>{systemSizeKwp.toFixed(2)} kWp</ThemedText>
              <ThemedText style={[styles.resultLabel, { color: colors.textSecondary }]}>Potência do sistema</ThemedText>
            </View>

            {/* Card Custo Estimado */}
            <View style={[styles.resultCard, { backgroundColor: colors.backgroundElement }]}>
              <Landmark size={22} color={colors.tint} />
              <ThemedText style={[styles.resultValue, { color: colors.text }]}>R$ {estimatedCost.toLocaleString('pt-BR')}</ThemedText>
              <ThemedText style={[styles.resultLabel, { color: colors.textSecondary }]}>Investimento médio</ThemedText>
            </View>
          </View>

          {/* Projeção de Retorno Financeiro */}
          <View style={[styles.economicsCard, { backgroundColor: colors.brandActiveBlue }]}>
            <ThemedText style={styles.economicsTitle}>Projeção de Economia Anual</ThemedText>
            <ThemedText style={styles.economicsValue}>
              R$ {annualSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </ThemedText>
            
            <View style={styles.divider} />
            
            <View style={styles.paybackRow}>
              <RefreshCw size={18} color={colors.backgroundElement} style={{ marginRight: 6 }} />
              <ThemedText style={[styles.paybackText, { color: colors.backgroundElement }]}>
                Retorno do investimento (Payback):{' '}
                <ThemedText style={{ fontWeight: 'bold', color: colors.backgroundElement }}>
                  {Math.floor(paybackYears)} {Math.floor(paybackYears) === 1 ? 'ano' : 'anos'}{' '}
                  {paybackMonths > 0 ? `e ${paybackMonths} ${paybackMonths === 1 ? 'mês' : 'meses'}` : ''}
                </ThemedText>
              </ThemedText>
            </View>
          </View>

          {/* CTA para Pedir Propostas */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.brandActiveBlue }]}
            onPress={handleRequestQuotes}
          >
            <ShieldCheck size={18} color={colors.backgroundElement} style={{ marginRight: 8 }} />
            <ThemedText style={styles.submitBtnText}>Comparar Propostas Gratuitas</ThemedText>
          </TouchableOpacity>
          
          <ThemedText style={styles.disclaimerText} themeColor="textSecondary">
            * Os valores exibidos são estimativas baseadas na média de radiação solar regional. Custos reais e área de telhado variam de acordo com a inclinação, orientação e sombras do imóvel.
          </ThemedText>

        </ScrollView>
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
  introCard: {
    marginBottom: Spacing.three,
  },
  introText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  stateSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  stateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    gap: 4,
  },
  stateBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dropdown: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    padding: Spacing.two,
    marginTop: -Spacing.one,
  },
  dropdownContent: {
    gap: Spacing.two,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 8,
  },
  dropdownItemText: {
    fontSize: 12,
  },
  billValueDisplay: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.tint,
    textAlign: 'center',
    marginVertical: Spacing.two,
  },
  billControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  controlBtn: {
    flex: 1,
    height: 40,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  resultsHeader: {
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  resultCard: {
    width: (width - Spacing.four * 2 - Spacing.three) / 2,
    padding: Spacing.three,
    borderRadius: 12,
    gap: 4,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  resultLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  economicsCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  economicsTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  economicsValue: {
    color: colors.backgroundElement,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
    marginVertical: Spacing.three,
  },
  paybackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  paybackText: {
    color: colors.backgroundElement,
    fontSize: 12,
  },
  submitBtn: {
    height: 50,
    borderRadius: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: colors.backgroundElement,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimerText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: Spacing.three,
    lineHeight: 14,
  },
});
