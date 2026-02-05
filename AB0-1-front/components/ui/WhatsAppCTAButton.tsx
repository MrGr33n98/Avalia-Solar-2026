'use client';

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { track } from '@/lib/analytics/lazy';
import { cn } from '@/lib/utils';

interface WhatsAppCTAButtonProps extends ButtonProps {
  phone?: string;
  message?: string;
  companyId?: string;
  companySlug?: string;
  label?: string;
  trackProps?: Record<string, any>;
}

/**
 * Standardized WhatsApp CTA Button with built-in tracking
 * Following Growth Architect principles: reduced friction, smart templates
 */
export const WhatsAppCTAButton = React.forwardRef<HTMLButtonElement, WhatsAppCTAButtonProps>(
  ({ 
    phone, 
    message = 'Olá, gostaria de solicitar um orçamento pelo Avalia Solar.', 
    companyId, 
    companySlug, 
    label = 'Conversar no WhatsApp',
    trackProps = {},
    className,
    onClick,
    ...props 
  }, ref) => {
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Track event
      track('whatsapp_click', {
        cta_label: label,
        company_id: companyId,
        company_slug: companySlug,
        phone_present: !!phone,
        template_used: message,
        ...trackProps
      }, { critical: true });

      if (onClick) {
        onClick(e);
      }

      if (phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    };

    return (
      <Button
        ref={ref}
        variant="outline"
        className={cn(
          "border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <WhatsAppIcon className="w-5 h-5" />
        {label}
      </Button>
    );
  }
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.868-2.03-.967-.273-.099-.472-.149-.671.15-.198.297-.769.967-.941 1.166-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.173.198-.297.298-.496.099-.198.05-.372-.025-.521-.075-.149-.671-1.614-.919-2.213-.243-.583-.49-.503-.671-.512-.173-.009-.372-.009-.571-.009-.198 0-.521.074-.794.372-.273.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.1 3.202 5.077 4.487.709.306 1.262.489 1.693.625.712.226 1.36.194 1.872.118.571-.085 1.758-.718 2.006-1.413.248-.695.248-1.29.173-1.413-.074-.123-.272-.198-.57-.347zM12.004 2C6.48 2 2 6.453 2 11.944c0 2.106.69 4.063 1.87 5.657L2 22l4.532-1.846c1.539.846 3.298 1.34 5.172 1.34 5.524 0 10.004-4.453 10.004-9.944C21.708 6.453 17.528 2 12.004 2zm0 17.708c-1.65 0-3.18-.446-4.47-1.223l-.32-.198-2.643 1.075.99-2.527-.22-.33c-1.04-1.513-1.585-3.28-1.585-5.061 0-5.087 4.198-9.225 9.29-9.225 5.083 0 9.281 4.138 9.281 9.225 0 5.087-4.198 9.264-9.333 9.264z" />
  </svg>
);

WhatsAppCTAButton.displayName = 'WhatsAppCTAButton';
