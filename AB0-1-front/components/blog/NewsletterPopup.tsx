'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { track } from '@/lib/analytics/lazy';

const STORAGE_KEY = 'blog_newsletter_popup_dismissed_v1';

export function NewsletterPopup() {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [isDismissed, setIsDismissed] = React.useState(false);
  const dismissedRef = React.useRef(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const handleScroll = () => {
      const scrollPercent =
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 40) {
        setOpen(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };

    const handleExitIntent = (event: MouseEvent) => {
      if (event.clientY <= 0) {
        setOpen(true);
        document.removeEventListener('mouseleave', handleExitIntent);
      }
    };

    const timer = setTimeout(() => {
      setOpen(true);
    }, 25000);

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mouseleave', handleExitIntent);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseleave', handleExitIntent);
      clearTimeout(timer);
    };
  }, []);

  React.useEffect(() => {
    if (open && !isDismissed) {
      track('blog_newsletter_popup_open', { placement: 'blog' });
    }
  }, [open, isDismissed]);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
    dismissedRef.current = true;
    track('blog_newsletter_popup_dismiss', { placement: 'blog' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    track('blog_newsletter_popup_submit', { placement: 'blog' });
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
    dismissedRef.current = true;
    setEmail('');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (value) {
          setOpen(true);
        } else if (!dismissedRef.current) {
          handleClose();
        } else {
          setOpen(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Assine nossa Newsletter</DialogTitle>
          <DialogDescription>
            Receba dicas e novidades sobre energia solar direto no seu e-mail.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            placeholder="Digite seu e-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            Inscrever-se
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
