import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BannerProps {
  type: 'rectangular_large' | 'rectangular_small';
  position: 'navbar' | 'sidebar';
  imageUrl: string;
  title: string;
  link?: string;
  sponsored?: boolean;
}

export function Banner({
  type,
  position,
  imageUrl,
  title,
  link,
  sponsored,
}: BannerProps) {
  const bannerContent = (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg',
        type === 'rectangular_large' ? 'w-full h-[200px]' : 'w-[300px] h-[250px]',
        position === 'navbar' ? 'mb-6' : 'mb-4'
      )}
    >
      <Image
        src={imageUrl}
        alt={title}
        fill
        className="object-cover"
        priority={position === 'navbar'}
      />
      {sponsored && (
        <span className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded text-xs">
          Patrocinado
        </span>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
        <h3 className="text-white font-semibold truncate">{title}</h3>
      </div>
    </div>
  );

  return link ? (
    <a href={link} target="_blank" rel="noopener noreferrer">
      {bannerContent}
    </a>
  ) : (
    bannerContent
  );
}