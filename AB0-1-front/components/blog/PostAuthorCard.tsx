'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Linkedin, Mail, Twitter } from 'lucide-react';

interface PostAuthorCardProps {
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  role?: string;
}

export function PostAuthorCard({ name, bio, avatarUrl, role = 'Editor & Especialista Solar' }: PostAuthorCardProps) {
  if (!name) return null;

  return (
    <Card className="bg-slate-50 border-none shadow-inner my-12 overflow-hidden">
      <CardContent className="p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <Avatar className="w-24 h-24 border-4 border-white shadow-sm shrink-0">
          <AvatarImage src={avatarUrl || ''} alt={name} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 text-center sm:text-left space-y-3">
          <div>
            <h3 className="font-bold text-xl text-slate-900">{name}</h3>
            <p className="text-sm font-medium text-primary">{role}</p>
          </div>
          
          {bio && (
            <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
              {bio}
            </p>
          )}

          <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white hover:text-[#0077b5]">
              <Linkedin className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white hover:text-[#1da1f2]">
              <Twitter className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white hover:text-slate-900">
              <Mail className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
