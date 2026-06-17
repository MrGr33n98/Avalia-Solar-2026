import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  useColorScheme,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Compass, Calculator, Star, ArrowRight, Sun } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const slides = [
    {
      title: 'Encontre integradores de confiança',
      description: 'Pesquise, filtre por raio de proximidade e visualize empresas qualificadas no mapa interativo.',
      icon: <Compass size={80} color="#208AEF" />,
      backgroundColor: '#E6F4FE',
    },
    {
      title: 'Simule o ROI do seu projeto',
      description: 'Use nossa calculadora solar integrada para simular o tempo de retorno financeiro e economia estimada.',
      icon: <Calculator size={80} color="#10B981" />,
      backgroundColor: '#E6FDF5',
    },
    {
      title: 'Avalie e compare propostas',
      description: 'Leia avaliações de outros clientes obtidas por QR Code e compare empresas lado a lado.',
      icon: <Star size={80} color="#F59E0B" fill="#F59E0B" />,
      backgroundColor: '#FFFBEB',
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const active = Math.round(offset / slideSize);
    setActiveIndex(active);
  };

  const handleNext = async () => {
    if (activeIndex < slides.length - 1) {
      scrollRef.current?.scrollTo({
        x: (activeIndex + 1) * width,
        animated: true,
      });
      setActiveIndex(activeIndex + 1);
    } else {
      await finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@avalia_solar:seen_onboarding', 'true');
    } catch (e) {
      console.warn('Erro ao salvar onboarding no AsyncStorage:', e);
    }
    router.replace('/');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header com botão Pular */}
        <View style={styles.header}>
          {activeIndex < slides.length - 1 ? (
            <TouchableOpacity onPress={finishOnboarding} style={styles.skipBtn}>
              <ThemedText style={styles.skipText} themeColor="textSecondary">Pular</ThemedText>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipPlaceholder} />
          )}
        </View>

        {/* Slides Scroll */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scroll}
        >
          {slides.map((slide, index) => (
            <View key={index} style={[styles.slide, { width }]}>
              <View style={[styles.iconContainer, { backgroundColor: slide.backgroundColor }]}>
                {slide.icon}
              </View>
              <ThemedText type="title" style={styles.slideTitle}>
                {slide.title}
              </ThemedText>
              <ThemedText style={styles.slideDesc} themeColor="textSecondary">
                {slide.description}
              </ThemedText>
            </View>
          ))}
        </ScrollView>

        {/* Footer com paginação e botão de avançar */}
        <View style={styles.footer}>
          
          {/* Indicadores (Dots) */}
          <View style={styles.dotsRow}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === activeIndex ? '#208AEF' : '#CBD5E1',
                    width: index === activeIndex ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {/* Botão de Próximo / Começar */}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: '#003E7E' }]}
            onPress={handleNext}
          >
            <ThemedText style={styles.nextBtnText}>
              {activeIndex === slides.length - 1 ? 'Começar' : 'Próximo'}
            </ThemedText>
            <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

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
    justifyContent: 'space-between',
  },
  header: {
    height: 50,
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  skipPlaceholder: {
    height: 30,
  },
  scroll: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    color: '#0F172A',
  },
  slideDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 30,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
