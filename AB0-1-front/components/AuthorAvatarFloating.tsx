'use client';

import Image from 'next/image';
import React from 'react';

interface AuthorAvatarFloatingProps {
  name: string;
  avatarUrl?: string;
  side?: 'left' | 'right';
}

const fallbackImg = '/images/avatar-placeholder.png';

const AuthorAvatarFloating: React.FC<AuthorAvatarFloatingProps> = ({ name, avatarUrl, side = 'left' }) => {
  const src = avatarUrl || fallbackImg;
  const alignClass = side === 'left' ? 'left-0' : 'right-0';

  return (
    <div
      className={`author-floating ${alignClass}`}
      aria-label={`Foto do autor ${name}`}
    >
      <div className="author-floating__image">
        <Image
          src={src}
          alt={name}
          fill
          sizes="150px"
          className="object-cover rounded-full"
        />
      </div>
      <style jsx>{`
        .author-floating {
          position: sticky;
          top: 120px;
          width: 150px;
          height: 150px;
          z-index: 10;
          pointer-events: none;
        }
        .author-floating__image {
          width: 150px;
          height: 150px;
          position: relative;
          border-radius: 50%;
          overflow: hidden;
          box-shadow: 0 0 0 2px #e5e7eb, 0 0 0 4px #ffffff, 0 8px 12px rgba(16,24,40,0.10);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .author-floating__image:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 12px rgba(0,0,0,0.12);
        }
        @media (max-width: 1024px) {
          .author-floating,
          .author-floating__image {
            width: 120px;
            height: 120px;
          }
        }
        @media (max-width: 640px) {
          .author-floating,
          .author-floating__image {
            width: 80px;
            height: 80px;
            position: absolute;
            top: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthorAvatarFloating;
