import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { BrandLogo } from '@/components/brand/BrandLogo';

interface ArticleBannerProps {
  title: string;
  category: string;
  imageUrl?: string;
  className?: string;
  isEditable?: boolean;
}

const ArticleBanner: React.FC<ArticleBannerProps> = ({ 
  title, 
  category, 
  imageUrl, 
  className = '',
  isEditable = false
}) => {
  return (
    <div 
      className={`relative w-full overflow-hidden bg-slate-900 ${className}`}
      /* Responsive height instead of a fixed giant aspect ratio */
      style={{ minHeight: '260px', maxHeight: '520px' }}
    >
      {/* Background Image with Overlay */}
      {imageUrl ? (
        <>
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="100vw"
            className="object-cover opacity-70"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/30" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-900 opacity-20" />
      )}

      {/* Content Container */}
      <div className="absolute inset-0 flex flex-col justify-end px-6 py-10 sm:px-10 lg:px-16">
        {/* Brand Element - Top Right (Optional) */}
        <div className="absolute top-6 right-6 sm:top-8 sm:right-8">
          <div className="rounded-lg border border-white/40 bg-white/95 px-3 py-2 backdrop-blur">
            <BrandLogo className="h-7 sm:h-8" sizes="139px" />
          </div>
        </div>

        {/* Category Badge */}
        <div className="mb-6">
          <Badge className="bg-cyan-600 hover:bg-cyan-700 text-white border-none text-sm sm:text-base px-3 sm:px-4 py-1.5 uppercase tracking-wide font-semibold shadow-lg">
            {category}
          </Badge>
        </div>

        {/* Title */}
        <h1 
          className={`text-white font-bold leading-tight drop-shadow-sm ${isEditable ? 'outline-dashed outline-2 outline-white/30' : ''}`}
          style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}
          contentEditable={isEditable}
          suppressContentEditableWarning={true}
        >
          {title}
        </h1>

        {/* Decorative Element */}
        <div className="w-20 sm:w-24 h-1.5 bg-cyan-600 mt-6 sm:mt-8 rounded-full" />
      </div>
    </div>
  );
};

export default ArticleBanner;
