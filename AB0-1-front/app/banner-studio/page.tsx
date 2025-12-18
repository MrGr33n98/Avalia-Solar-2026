'use client';

import React, { useState, useRef } from 'react';
import ArticleBanner from '@/components/ArticleBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toPng } from 'html-to-image';

export default function BannerStudio() {
  const [title, setTitle] = useState('Título do Artigo Aqui');
  const [category, setCategory] = useState('Categoria');
  const [bgImage, setBgImage] = useState('');
  const bannerRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBgImage(url);
    }
  };

  const handleDownload = async () => {
    if (bannerRef.current) {
      try {
        const dataUrl = await toPng(bannerRef.current, {
          width: 1200,
          height: 630,
          pixelRatio: 1,
        });
        const link = document.createElement('a');
        link.download = `banner-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Erro ao gerar imagem:', err);
      }
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Banner Studio</h1>
        <Button onClick={handleDownload} size="lg" className="bg-orange-500 hover:bg-orange-600">
          Baixar PNG (1200x630)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6 h-fit">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Artigo</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Digite o título..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input 
              id="category" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              placeholder="Ex: Energia Solar"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bg-image">Imagem de Fundo</Label>
            <Input 
              id="bg-image" 
              type="file" 
              accept="image/*"
              onChange={handleImageUpload} 
            />
            <p className="text-xs text-gray-500">Recomendado: 1200x630px ou maior</p>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg overflow-auto flex justify-center items-center border-2 border-dashed border-gray-300">
            <div ref={bannerRef} className="shrink-0 shadow-2xl" style={{ width: '1200px', height: '630px' }}>
              <ArticleBanner 
                title={title} 
                category={category} 
                imageUrl={bgImage || undefined}
              />
            </div>
          </div>
          <p className="text-center text-sm text-gray-500">
            Preview em escala reduzida. O download será em tamanho real (1200x630px).
          </p>
        </div>
      </div>
    </div>
  );
}
