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
    <Card className="group flex flex-col h-full overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-200/60 bg-white">
      <div className="relative h-52 w-full bg-slate-100 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 bg-slate-50">
            <span className="text-sm font-medium">Sem imagem</span>
          </div>
        )}
        {article.category && (
          <Badge className="absolute top-3 right-3 bg-white/90 text-slate-900 hover:bg-white shadow-sm backdrop-blur-sm">
            {article.category.name}
          </Badge>
        )}
      </div>
      
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-xs font-medium text-slate-500 space-x-3">
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              {publishedLabel}
            </span>
            {article.views_count !== null && (
              <span className="flex items-center">
                <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                {article.views_count}
              </span>
            )}
          </div>
          {article.sponsored && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 uppercase tracking-wider">
              {article.sponsored_label || 'Patrocinado'}
            </span>
          )}
        </div>
        <Link href={`/blog/${article.slug}`} className="block group-hover:text-primary transition-colors">
          <h3 className="text-lg font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {article.title}
          </h3>
        </Link>
      </CardHeader>
      
      <CardContent className="p-5 pt-0 flex-grow">
        <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
          {article.excerpt}
        </p>
      </CardContent>
      
      <CardFooter className="p-5 pt-3 border-t border-slate-100 bg-slate-50/50">
        <Button asChild variant="ghost" size="sm" className="w-full justify-between hover:bg-white hover:text-primary hover:shadow-sm transition-all p-0 px-2 -ml-2 font-medium text-slate-600">
          <Link href={`/blog/${article.slug}`}>
            <span>Ler artigo completo</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
