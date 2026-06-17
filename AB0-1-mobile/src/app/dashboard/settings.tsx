import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Building2, Phone, Globe, Clock, ShieldAlert, Check } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';

export default function DashboardSettingsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();

  // Estados dos formulários corporativos
  const [phone, setPhone] = useState('(11) 2222-3333');
  const [website, setWebsite] = useState('www.solarprime.com.br');
  const [hours, setHours] = useState('08:00 - 18:00');
  
  // Status de Recursos
  const [p2pEnabled, setP2pEnabled] = useState(true);
  const [notifyLeads, setNotifyLeads] = useState(true);

  const handleSaveSettings = () => {
    Alert.alert('Sucesso', 'As configurações da empresa foram salvas com sucesso!');
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={colors.backgroundElement} size={24} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Configurações da Empresa</ThemedText>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSaveSettings}>
          <Check color={colors.tint} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Informações de Contato */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Canais de Atendimento</ThemedText>
          
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Telefone Comercial</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundElement }]}>
              <Phone size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Website Institucional</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundElement }]}>
              <Globe size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={website}
                onChangeText={setWebsite}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Horário de Funcionamento</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundElement }]}>
              <Clock size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={hours}
                onChangeText={setHours}
              />
            </View>
          </View>
        </View>

        {/* Recursos da Conta */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Recursos do Marketplace</ThemedText>
          
          <View style={[styles.switchRow, { borderBottomColor: colors.backgroundSelected }]}>
            <View style={styles.switchTextContainer}>
              <ThemedText style={styles.switchLabel}>Chat P2P Direto</ThemedText>
              <ThemedText style={styles.switchDesc} themeColor="textSecondary">
                Permitir que clientes iniciem conversas no formato OLX Style pelo app.
              </ThemedText>
            </View>
            <Switch
              value={p2pEnabled}
              onValueChange={setP2pEnabled}
              trackColor={{ false: colors.border, true: '#93C5FD' }}
              thumbColor={p2pEnabled ? colors.tint : '#F4F4F5'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <ThemedText style={styles.switchLabel}>Alertas de Novos Leads</ThemedText>
              <ThemedText style={styles.switchDesc} themeColor="textSecondary">
                Notificações push imediatas ao receber orçamentos na sua região.
              </ThemedText>
            </View>
            <Switch
              value={notifyLeads}
              onValueChange={setNotifyLeads}
              trackColor={{ false: colors.border, true: '#93C5FD' }}
              thumbColor={notifyLeads ? colors.tint : '#F4F4F5'}
            />
          </View>
        </View>

        {/* Botão de salvar no final */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.brandDarkBlue }]}
          onPress={handleSaveSettings}
        >
          <ThemedText style={styles.saveButtonText}>Salvar Configurações</ThemedText>
        </TouchableOpacity>

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
  saveHeaderBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 24,
  },
  section: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  switchTextContainer: {
    flex: 0.8,
    gap: 2,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.backgroundElement,
  },
  switchDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  saveButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: colors.backgroundElement,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
