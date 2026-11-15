'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { track } from '@/lib/analytics';
import styles from './CompanyRegistrationTicker.module.css';

// Palavra-chave exata: WAHA só dispara depois que o visitante envia a mensagem.
const WHATSAPP_REGISTRATION_NUMBER = (
  process.env.NEXT_PUBLIC_WHATSAPP_REGISTRATION_NUMBER || '5565993465055'
).replace(/\D/g, '');

export const COMPANY_REGISTRATION_WHATSAPP_URL =
  `https://wa.me/${WHATSAPP_REGISTRATION_NUMBER || '5565993465055'}?text=CADASTRAR`;

const MARQUEE_SPEED_PX_PER_SECOND = 38;
const DEFAULT_LAYOUT = { copiesPerGroup: 12, durationSeconds: 64 };

/**
 * Dois grupos de largura idêntica são necessários para um loop sem saltos.
 * Cada grupo deve cobrir toda a área visível mais duas mensagens de margem.
 * A velocidade é baseada na distância real, não em um tempo fixo por viewport.
 */
export function getTickerLayout(viewportWidth: number, messageWidth: number) {
  if (
    !Number.isFinite(viewportWidth) ||
    !Number.isFinite(messageWidth) ||
    viewportWidth <= 0 ||
    messageWidth <= 0
  ) {
    return DEFAULT_LAYOUT;
  }

  const copiesPerGroup = Math.max(4, Math.ceil(viewportWidth / messageWidth) + 2);
  return {
    copiesPerGroup,
    durationSeconds: Number(
      ((copiesPerGroup * messageWidth) / MARQUEE_SPEED_PX_PER_SECOND).toFixed(2)
    ),
  };
}

export default function CompanyRegistrationTicker() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const firstMessageRef = useRef<HTMLSpanElement>(null);
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);

  useEffect(() => {
    const viewport = viewportRef.current;
    const firstMessage = firstMessageRef.current;
    if (!viewport || !firstMessage) return;

    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const viewportWidth = viewport.getBoundingClientRect().width;
      const messageWidth = firstMessage.getBoundingClientRect().width;
      if (viewportWidth <= 0 || messageWidth <= 0) return;
      const next = getTickerLayout(viewportWidth, messageWidth);
      setLayout((current) =>
        current.copiesPerGroup === next.copiesPerGroup &&
        current.durationSeconds === next.durationSeconds
          ? current
          : next
      );
    };

    measure();

    // ResizeObserver recalcula a quantidade de cópias em desktop, tablet e PWA
    // sem detectar User-Agent e sem criar intervalos/loops em background.
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(viewport);
    observer?.observe(firstMessage);
    window.addEventListener('resize', measure);

    // Fontes carregadas posteriormente também podem alterar a largura do texto.
    void document.fonts?.ready.then(measure);

    return () => {
      disposed = true;
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const handleCtaClick = () => {
    track('cta_click', {
      cta_text: 'Cadastrar',
      cta_type: 'whatsapp_company_signup',
      cta_location: 'navbar_top_ticker',
      channel: 'whatsapp',
      keyword: 'CADASTRAR',
    });
  };

  return (
    <div
      role="region"
      aria-label="Cadastro de empresas no Avalia Solar"
      data-testid="company-registration-ticker"
      className={styles.ticker}
    >
      <div
        ref={viewportRef}
        className={styles.messageViewport}
        data-testid="company-registration-viewport"
      >
        <span className="sr-only">Cadastre sua empresa no Avalia Solar</span>
        <div
          className={styles.marqueeTrack}
          data-testid="company-registration-track"
          aria-hidden="true"
          style={{ '--ticker-duration': `${layout.durationSeconds}s` } as CSSProperties}
        >
          {[0, 1].map((group) => (
            <div
              key={group}
              className={styles.marqueeGroup}
              data-testid="company-registration-group"
            >
              {Array.from({ length: layout.copiesPerGroup }, (_, index) => (
                <span
                  key={index}
                  ref={group === 0 && index === 0 ? firstMessageRef : undefined}
                  className={styles.message}
                  data-testid="company-registration-message"
                >
                  Cadastre sua empresa no&nbsp;
                  <strong className={styles.brand}>Avalia Solar</strong>
                  <span className={styles.separator} aria-hidden="true" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <a
        href={COMPANY_REGISTRATION_WHATSAPP_URL}
        onClick={handleCtaClick}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Cadastrar empresa via WhatsApp"
        data-testid="company-registration-cta"
        className={styles.ctaHitArea}
      >
        <span className={styles.ctaPill} data-testid="company-registration-cta-pill">
          Cadastrar
        </span>
      </a>
    </div>
  );
}
