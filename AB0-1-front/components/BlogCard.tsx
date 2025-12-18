import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Calendar, Eye, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Article } from '@/types/article';
import { getFullImageUrl } from '@/utils/image';

interface BlogCardProps {
  article: Article;
}

export default function BlogCard({ article }: BlogCardProps) {
  const imageUrl = getFullImageUrl(article.image_url) || undefined;
  const publishedLabel = article.published_at
    ? new Date(article.published_at).toLocaleDateString('pt-BR')
    : 'Data indisponível';

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 w-full bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <span className="text-sm">Sem imagem</span>
          </div>
        )}
        {article.category && (
          <Badge className="absolute top-2 right-2 bg-primary text-white">
            {article.category.name}
          </Badge>
        )}
      </div>
      
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center text-xs text-gray-500 mb-2 space-x-3">
          <span className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {publishedLabel}
          </span>
          <span className="flex items-center">
            <Eye className="w-3 h-3 mr-1" />
            {article.views_count ?? 0}
          </span>
        </div>
        <Link href={`/blog/${article.slug}`}>
          <h3 className="text-lg font-bold text-gray-900 hover:text-primary line-clamp-2">
            {article.title}
          </h3>
        </Link>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 flex-grow">
        <p className="text-sm text-gray-600 line-clamp-3">
          {article.excerpt}
        </p>
      </CardContent>
      
      <CardFooter className="p-4 border-t bg-gray-50">
        <Button asChild variant="ghost" size="sm" className="w-full justify-between hover:bg-transparent p-0">
          <Link href={`/blog/${article.slug}`}>
            Ler mais <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
