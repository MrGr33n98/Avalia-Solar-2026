'use client';

/**
 * Advanced Carousel Component with Premium Features
 * 
 * Características:
 * - Hardware-accelerated CSS transitions
 * - Touch-friendly controls
 * - Intelligent asset preloading
 * - Customizable via admin panel
 * - Lazy loading support
 * - Performance optimized
 * 
 * @module AdvancedCarousel
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CarouselItem {
  id: string | number;
  image_url: string;
  title: string;
  link?: string;
  alt?: string;
  priority?: boolean;
}

interface AdvancedCarouselProps {
  items: CarouselItem[];
  autoplay?: boolean;
  interval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  transitionDuration?: number;
  aspectRatio?: string;
  className?: string;
  preloadCount?: number;
  loop?: boolean;
  pauseOnHover?: boolean;
  swipeable?: boolean;
  onSlideChange?: (index: number) => void;
}

export default function AdvancedCarousel({
  items,
  autoplay = true,
  interval = 5000,
  showControls = true,
  showIndicators = true,
  transitionDuration = 500,
  aspectRatio = '16/9',
  className,
  preloadCount = 2,
  loop = true,
  pauseOnHover = true,
  swipeable = true,
  onSlideChange,
}: AdvancedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  
  const carouselRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Preload images for better performance
  useEffect(() => {
    const preloadImages = () => {
      const imagesToPreload = new Set<string>();
      
      for (let i = 0; i < Math.min(preloadCount, items.length); i++) {
        const index = (currentIndex + i) % items.length;
        imagesToPreload.add(items[index].image_url);
      }
      
      imagesToPreload.forEach((url) => {
        if (!preloadedImages.has(url)) {
          const img = new window.Image();
          img.src = url;
          img.onload = () => {
            setPreloadedImages((prev) => new Set([...prev, url]));
          };
        }
      });
    };

    preloadImages();
  }, [currentIndex, items, preloadCount, preloadedImages]);

  // Autoplay functionality
  useEffect(() => {
    if (isPlaying && items.length > 1) {
      intervalRef.current = setInterval(() => {
        handleNext();
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, currentIndex, items.length, interval]);

  // Notify parent component of slide change
  useEffect(() => {
    if (onSlideChange) {
      onSlideChange(currentIndex);
    }
  }, [currentIndex, onSlideChange]);

  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      if (loop) {
        return (prev + 1) % items.length;
      }
      return prev < items.length - 1 ? prev + 1 : prev;
    });
    
    setTimeout(() => setIsTransitioning(false), transitionDuration);
  }, [isTransitioning, loop, items.length, transitionDuration]);

  const handlePrev = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      if (loop) {
        return prev === 0 ? items.length - 1 : prev - 1;
      }
      return prev > 0 ? prev - 1 : prev;
    });
    
    setTimeout(() => setIsTransitioning(false), transitionDuration);
  }, [isTransitioning, loop, items.length, transitionDuration]);

  const handleDotClick = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), transitionDuration);
  }, [isTransitioning, currentIndex, transitionDuration]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Touch/Swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!swipeable) return;
    setTouchStart(e.targetTouches[0].clientX);
  }, [swipeable]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeable) return;
    setTouchEnd(e.targetTouches[0].clientX);
  }, [swipeable]);

  const handleTouchEnd = useCallback(() => {
    if (!swipeable) return;
    
    const minSwipeDistance = 50;
    const distance = touchStart - touchEnd;
    
    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  }, [swipeable, touchStart, touchEnd, handleNext, handlePrev]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, togglePlayPause]);

  if (!items || items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex];

  return (
    <div
      ref={carouselRef}
      className={cn(
        'relative w-full overflow-hidden rounded-lg group',
        className
      )}
      style={{ aspectRatio }}
      onMouseEnter={() => pauseOnHover && setIsPlaying(false)}
      onMouseLeave={() => pauseOnHover && autoplay && setIsPlaying(true)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Carousel"
      aria-live="polite"
    >
      {/* Main Carousel Content */}
      <div className="relative w-full h-full">
        <div
          className="flex w-full h-full transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            willChange: 'transform',
          }}
        >
          {items.map((item, index) => {
            const isVisible = Math.abs(index - currentIndex) <= preloadCount;
            
            return (
              <div
                key={item.id}
                className="relative w-full h-full flex-shrink-0"
                aria-hidden={index !== currentIndex}
              >
                {isVisible && (
                  <Link
                    href={item.link || '#'}
                    target={item.link ? '_blank' : undefined}
                    rel={item.link ? 'noopener noreferrer' : undefined}
                    className="block w-full h-full"
                  >
                    <Image
                      src={item.image_url}
                      alt={item.alt || item.title}
                      fill
                      priority={index === 0 || item.priority}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      sizes="100vw"
                      className="object-cover transition-opacity duration-300"
                      quality={90}
                    />
                    
                    {/* Overlay with title */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-white text-2xl font-bold drop-shadow-lg">
                        {item.title}
                      </h3>
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      {showControls && items.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 z-10',
              'bg-white/80 hover:bg-white text-black',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'backdrop-blur-sm shadow-lg'
            )}
            onClick={handlePrev}
            disabled={!loop && currentIndex === 0}
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2 z-10',
              'bg-white/80 hover:bg-white text-black',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'backdrop-blur-sm shadow-lg'
            )}
            onClick={handleNext}
            disabled={!loop && currentIndex === items.length - 1}
            aria-label="Próximo slide"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Play/Pause Button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute bottom-4 right-4 z-10',
              'bg-white/80 hover:bg-white text-black',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'backdrop-blur-sm shadow-lg'
            )}
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                'hover:bg-white/90',
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50'
              )}
              aria-label={`Ir para slide ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      )}

      {/* Loading indicator for transitions */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-black/10 z-20 pointer-events-none" />
      )}
    </div>
  );
}
