'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Calendar, ArrowRight } from 'lucide-react';
import { FeaturedPost } from '@/lib/api/blog';
import { getFullImageUrl } from '@/utils/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FeaturedPostsSectionProps {
  posts: FeaturedPost[];
}

export function FeaturedPostsSection({ posts }: FeaturedPostsSectionProps) {
  if (!posts || posts.length === 0) return null;

  const mainPost = posts[0];
  const sidePosts = posts.slice(1, 3);

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full" />
          Destaques da Semana
        </h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Featured Post */}
        <div className="lg:col-span-8 group relative">
          <Link href={`/blog/${mainPost.slug}`} className="block h-full">
            <Card className="h-full overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300">
              <div className="relative h-64 sm:h-80 lg:h-full w-full">
                <Image
                  src={getFullImageUrl(mainPost.cover_image_url)}
                  alt={mainPost.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                
                <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full">
                  {mainPost.category && (
                    <Badge className="mb-3 bg-primary hover:bg-primary/90 text-white border-none">
                      {mainPost.category.name}
                    </Badge>
                  )}
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3 leading-tight group-hover:text-primary-foreground/90 transition-colors">
                    {mainPost.title}
                  </h3>
                  <p className="text-slate-200 line-clamp-2 mb-4 max-w-2xl text-sm sm:text-base">
                    {mainPost.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-300 font-medium">
                    {mainPost.author && (
                      <div className="flex items-center gap-2">
                        {mainPost.author.avatar_url && (
                          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20">
                            <Image 
                              src={getFullImageUrl(mainPost.author.avatar_url)} 
                              alt={mainPost.author.name} 
                              fill 
                              className="object-cover" 
                            />
                          </div>
                        )}
                        <span>{mainPost.author.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(mainPost.published_at), "d MMM, yyyy", { locale: ptBR })}
                    </div>
                    {mainPost.reading_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {mainPost.reading_time} min
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Side Posts */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {sidePosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="block flex-1 group">
              <Card className="h-full border-none shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden bg-white">
                <div className="relative h-40 w-full shrink-0 overflow-hidden">
                  <Image
                    src={getFullImageUrl(post.cover_image_url) || '/images/avalia-solar-place-holder.PNG'}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                     {post.category && (
                      <Badge variant="secondary" className="bg-white/90 text-slate-900 hover:bg-white backdrop-blur-sm text-xs font-bold shadow-sm">
                        {post.category.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-5 flex flex-col flex-1">
                  <h4 className="font-bold text-lg text-slate-900 mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  <div className="mt-auto pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(post.published_at), "d MMM", { locale: ptBR })}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                      Ler artigo <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
