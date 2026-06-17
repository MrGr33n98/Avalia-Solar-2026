import React from 'react';
import { Colors } from '@/constants/theme';
import { StyleSheet, View, FlatList, TouchableOpacity, RefreshControl, useColorScheme } , useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Image } from 'expo-image';

import { conversationsApi } from '@/lib/api';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingList } from '@/components/ui/LoadingList';

export default function InboxScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  const { data: conversations = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['conversations'],
    queryFn: conversationsApi.getAll,
  });

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: any }) => {
    // Tratamento defensivo dos dados da API
    const id = item.id?.toString() || Math.random().toString();
    const companyName = item.company?.name || item.company_name || 'Empresa desconhecida';
    const companyLogo = item.company?.logo_url || item.company_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=0D8ABC&color=fff`;
    const lastMessage = item.last_message?.body || item.lastMessage || 'Nenhuma mensagem';
    const time = formatTime(item.last_message?.created_at || item.updated_at) || item.time || '';
    const unreadCount = item.unread_count || item.unreadCount || 0;

    return (
      <TouchableOpacity
        style={[styles.chatCard, { backgroundColor: colors.backgroundElement }]}
        onPress={() => router.push(`/chat/${id}`)}
      >
        <Image source={{ uri: companyLogo }} style={styles.avatar} />
        <View style={styles.chatInfo}>
          <View style={styles.chatHeaderRow}>
            <ThemedText style={[styles.companyName, { color: colors.text }]} numberOfLines={1}>
              {companyName}
            </ThemedText>
            <ThemedText style={[styles.timeText, { color: colors.textSecondary }]}>{time}</ThemedText>
          </View>
          <View style={styles.chatFooterRow}>
            <ThemedText style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
              {lastMessage}
            </ThemedText>
            {unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.tint }]}>
                <ThemedText style={styles.unreadText}>{unreadCount}</ThemedText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.backgroundElement }} />
      <View style={[styles.header, { backgroundColor: colors.backgroundElement, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surfaceSubtle }]}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Minhas Conversas</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <LoadingList count={6} />
      ) : isError ? (
        <ErrorState 
          title="Erro ao carregar conversas" 
          message="Não foi possível buscar as conversas. Verifique sua conexão e tente novamente."
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContainer, conversations.length === 0 && { flex: 1 }]}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              colors={[colors.tint]}
              tintColor={colors.tint}
            />
          }
          ListEmptyComponent={
            <EmptyState 
              title="Nenhuma conversa ainda" 
              subtitle="Solicite orçamentos para iniciar negociações com empresas de energia solar."
            />
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  listContainer: {
    paddingVertical: Spacing.two,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: Spacing.three,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
  },
  chatFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 16,
  },
  unreadBadge: {
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadText: {
    color: colors.backgroundElement,
    fontSize: 10,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    marginLeft: 80,
  },
});
