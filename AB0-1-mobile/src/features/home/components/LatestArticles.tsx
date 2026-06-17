import React from 'react';
import { StyleSheet, View, TouchableOpacity, useColorScheme, Image } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverUrl?: string;
}

interface LatestArticlesProps {
  articles: Article[];
  onPress: (article: Article) => void;
}

export const LatestArticles = ({ articles, onPress }: LatestArticlesProps) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  if (!articles || articles.length === 0) return null;

  return (
    <View style={styles.container}>
      {articles.map((article, index) => {
        const hasCover = !!article.coverUrl;
        const isLast = index === articles.length - 1;

        return (
          <TouchableOpacity
            key={article.id}
            style={[
              styles.articleRow,
              { borderBottomColor: colors.border },
              !isLast && styles.borderBottom,
            ]}
            onPress={() => onPress(article)}
            activeOpacity={0.8}
          >
            {/* Imagem do Post na esquerda */}
            {hasCover ? (
              <Image
                source={{ uri: article.coverUrl }}
                style={styles.articleImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: '#F3F4F6' }]}>
                <BookOpen color="#8B5CF6" size={24} />
              </View>
            )}

            {/* Conteúdo na direita */}
            <View style={styles.textContainer}>
              <ThemedText style={styles.articleTitle} numberOfLines={2}>
                {article.title}
              </ThemedText>
              {article.excerpt && (
                <ThemedText style={styles.articleExcerpt} themeColor="textSecondary" numberOfLines={2}>
                  {article.excerpt}
                </ThemedText>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.four,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  articleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  articleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
    gap: 4,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 18,
  },
  articleExcerpt: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
});
