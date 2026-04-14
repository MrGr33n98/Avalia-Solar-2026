'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Linkedin, Mail, Twitter, FileText, Star, Users } from 'lucide-react';

interface AuthorCardWithStatsProps {
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  role?: string;
  stats?: {
    posts: number;
    likes: number;
    followers: number;
  };
}

export function AuthorCardWithStats({ 
  name, 
  bio, 
  avatarUrl, 
  role = 'CEO & Fundador',
  stats
}: AuthorCardWithStatsProps) {
  if (!name) return null;

  return (
    <Card className="bg-slate-50 border-none shadow-inner my-12 overflow-hidden">
      <CardContent className="p-8 flex flex-col sm:flex-row gap-8 items-start">
        <div className="flex flex-col items-center gap-4 shrink-0 mx-auto sm:mx-0">
          <Avatar className="w-20 h-20 border border-slate-100 shadow-sm">
            <AvatarImage src={avatarUrl || ''} alt={name} className="object-cover object-center scale-[1.15] w-full h-full" />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex gap-2">
            <a href="https://www.linkedin.com/in/felipe-morais-8bb61a7b/?locale=pt" target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-[#0077b5]/10 text-slate-500 hover:text-[#0077b5] transition-colors">
                <Linkedin className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
        
        <div className="flex-1 text-center sm:text-left space-y-4 w-full">
          <div>
            <h3 className="font-bold text-xl text-slate-900">{name}</h3>
            <p className="text-sm font-medium text-primary">{role}</p>
          </div>
          
          {bio && (
            <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
              {bio}
            </p>
          )}

          {stats && (
            <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-4 mt-4 w-full max-w-md mx-auto sm:mx-0">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Posts</span>
                </div>
                <span className="font-bold text-slate-900">{stats.posts}</span>
              </div>
              <div className="text-center border-l border-slate-200">
                <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-1">
                  <Star className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Likes</span>
                </div>
                <span className="font-bold text-slate-900">{stats.likes}</span>
              </div>
              <div className="text-center border-l border-slate-200">
                <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Seguidores</span>
                </div>
                <span className="font-bold text-slate-900">
                  {stats.followers >= 1000 ? `${(stats.followers / 1000).toFixed(1)}k` : stats.followers}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
