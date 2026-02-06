'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Calculator } from 'lucide-react';
import { openQuoteWizard } from '@/lib/quote-wizard';

export function StickyMobileCTA() {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 300px
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 lg:hidden animate-in slide-in-from-bottom duration-300">
      <div className="flex gap-3 max-w-md mx-auto">
        <Button 
          className="flex-1 shadow-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground" 
          size="lg"
          onClick={() => openQuoteWizard({ source: 'sticky_mobile' })}
        >
          <Calculator className="w-4 h-4 mr-2" />
          Orçamento
        </Button>
        <Button 
          variant="outline" 
          className="flex-1 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 font-bold" 
          size="lg" 
          onClick={() => window.open('https://wa.me/556593465055', '_blank')}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          WhatsApp
        </Button>
      </div>
    </div>
  );
}
