import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, Sun, Cpu, Battery, Wrench, ChevronDown, Award, Lightbulb } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

interface Article {
  id: number;
  title: string;
  category: string;
  icon: React.ReactNode;
  summary: string;
  content: string;
}

export default function GuidesScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const articles: Article[] = [
    {
      id: 1,
      category: 'Inversores',
      title: 'Como escolher o inversor solar ideal?',
      icon: <Cpu size={18} color="#208AEF" />,
      summary: 'Entenda a diferença entre inversor de string, microinversor e inversor híbrido para seu projeto.',
      content: 'O inversor é o cérebro do sistema fotovoltaico, convertendo a corrente contínua (CC) gerada pelas placas em corrente alternada (CA) usada na sua casa.\n\n• Inversor String: Ideal para telhados planos, sem sombras. É o modelo clássico e com menor custo.\n• Microinversores: Instalados individualmente atrás de cada placa. Excelente para telhados com muitas orientações ou sombras localizadas, garantindo máxima eficiência placa por placa.\n• Inversores Híbridos: Permitem conectar baterias para armazenar o excedente de energia para a noite ou quedas de luz.',
    },
    {
      id: 2,
      category: 'Baterias',
      title: 'Baterias de Lítio vs Chumbo-Ácido no Off-Grid',
      icon: <Battery size={18} color="#10B981" />,
      summary: 'Qual bateria escolher para ter armazenamento solar durável e seguro na sua fazenda ou sítio?',
      content: 'Se você está projetando um sistema Off-Grid ou Híbrido, a escolha da bateria é crucial para a vida útil do sistema.\n\n• Lítio (LiFePO4): É a tecnologia mais moderna. Possui vida útil de até 10 anos (6.000 ciclos), pode ser descarregada quase 100% e é compacta. O custo inicial é maior, mas o custo por ciclo é muito mais barato a longo prazo.\n• Chumbo-Ácido estacionária: Mais barata inicialmente, porém dura cerca de 2 a 3 anos (500 a 800 ciclos) e só pode descarregar 50% de sua capacidade para não estragar.',
    },
    {
      id: 3,
      category: 'Garantias',
      title: 'Como funciona a garantia das placas solares?',
      icon: <Award size={18} color="#F59E0B" />,
      summary: 'Os painéis solares realmente duram 25 anos? Entenda as regras de garantia de desempenho.',
      content: 'Os painéis solares têm duas garantias diferentes que todo comprador deve conhecer:\n\n1. Garantia de Fabricação: Cobre defeitos físicos nos cabos, molduras ou células. Costuma variar entre 10 e 15 anos.\n2. Garantia de Geração/Desempenho: Garante que os painéis continuarão gerando energia com eficiência após décadas. A regra geral da indústria é que, após 25 anos de uso, as placas devem gerar pelo menos 80% a 85% da potência original.',
    },
    {
      id: 4,
      category: 'Instalação',
      title: 'O que observar antes de instalar os painéis?',
      icon: <Wrench size={18} color="#8B5CF6" />,
      summary: 'Confira as condições estruturais do seu telhado, fiação elétrica interna e sombreamentos.',
      content: 'Antes de assinar um contrato, certifique-se de que a empresa fará uma visita técnica estruturada:\n\n• Orientação: No Brasil, o ideal é que as placas fiquem apontadas para o Norte geográfico para receber o sol da tarde.\n• Inclinação: Deve ser equivalente à latitude da sua cidade para maximizar a captação média anual.\n• Estrutura do Telhado: Os painéis e trilhos pesam cerca de 15kg/m². Telhados de madeira antigos podem precisar de reforço estrutural antes da instalação.',
    },
  ];

  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color={colors.text} size={22} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Guias & Dicas Rápidas</ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.heroCard}>
            <BookOpen size={24} color="#208AEF" />
            <ThemedText style={styles.heroText}>
              Aprenda a fazer as melhores escolhas para a sua transição energética sustentável.
            </ThemedText>
          </View>

          {/* Listagem de Artigos */}
          <View style={styles.articlesList}>
            {articles.map((art) => {
              const isExpanded = expandedId === art.id;
              return (
                <View
                  key={art.id}
                  style={[styles.articleCard, { backgroundColor: colors.backgroundElement }]}
                >
                  <TouchableOpacity
                    style={styles.cardHeaderRow}
                    onPress={() => toggleExpand(art.id)}
                  >
                    <View style={styles.headerLeft}>
                      <View style={[styles.iconWrapper, { backgroundColor: colors.background }]}>
                        {art.icon}
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.categoryLabel}>{art.category}</ThemedText>
                        <ThemedText style={styles.articleTitle}>{art.title}</ThemedText>
                      </View>
                    </View>
                    <ChevronDown
                      size={18}
                      color="#8E8E93"
                      style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
                    />
                  </TouchableOpacity>

                  {/* Detalhe Expandido */}
                  {isExpanded ? (
                    <View style={[styles.expandedContent, { borderTopColor: colors.border }]}>
                      <ThemedText style={styles.contentText} themeColor="textSecondary">
                        {art.content}
                      </ThemedText>
                      
                      <View style={[styles.tipBanner, { backgroundColor: 'rgba(32, 138, 239, 0.08)' }]}>
                        <Lightbulb size={16} color="#208AEF" style={{ marginRight: 6 }} />
                        <ThemedText style={styles.tipBannerText}>
                          Dica: Faça a simulação na calculadora do app antes de pedir propostas.
                        </ThemedText>
                      </View>
                    </View>
                  ) : (
                    <ThemedText style={styles.summaryText} themeColor="textSecondary" numberOfLines={2}>
                      {art.summary}
                    </ThemedText>
                  )}
                </View>
              );
            })}
          </View>

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
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  heroText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  articlesList: {
    gap: Spacing.three,
  },
  articleCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(142, 142, 147, 0.08)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  summaryText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: Spacing.two,
    paddingLeft: 38 + Spacing.three,
  },
  expandedContent: {
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
  },
  contentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    marginTop: Spacing.three,
  },
  tipBannerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#208AEF',
    flex: 1,
  },
});
