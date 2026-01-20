import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface AuthorBioProps {
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  role?: string;
}

export default function AuthorBio({ name, bio, avatarUrl, role = 'Autor' }: AuthorBioProps) {
  if (!name) return null;

  return (
    <Card className="bg-slate-50 border-none shadow-sm mt-8">
      <CardContent className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-6">
        <Avatar className="w-20 h-20 border-2 border-white shadow-sm">
          <AvatarImage src={avatarUrl || ''} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="text-center sm:text-left space-y-2 flex-1">
          <div>
            <h3 className="font-bold text-lg text-slate-900">{name}</h3>
            <p className="text-sm text-slate-500 font-medium">{role}</p>
          </div>
          {bio && (
            <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
              {bio}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
