import React from 'react';
import { Colors } from '@/constants/theme';
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
    <View style={[styles.container, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
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
                style={[styles.articleImage, { backgroundColor: colors.surfaceSubtle }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: colors.surfaceSubtle }]}>
                <BookOpen color={colors.tint} size={24} />
              </View>
            )}

            {/* Conteúdo na direita */}
            <View style={styles.textContainer}>
              <ThemedText style={[styles.articleTitle, { color: colors.text }]} numberOfLines={2}>
                {article.title}
              </ThemedText>
              {article.excerpt && (
                <ThemedText style={[styles.articleExcerpt, { color: colors.textSecondary }]} numberOfLines={2}>
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
    backgroundColor: colors.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.border,
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
    color: colors.text,
    lineHeight: 18,
  },
  articleExcerpt: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
});
