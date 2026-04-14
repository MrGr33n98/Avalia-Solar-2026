import { ImageResponse } from 'next/og';

import { SITE, CONTACT, absoluteUrl } from '@/lib/site';

export const runtime = 'edge';
export const alt = 'Avalia Solar';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          background:
            'radial-gradient(circle at top left, rgba(34, 197, 94, 0.35), transparent 30%), radial-gradient(circle at 85% 15%, rgba(14, 165, 233, 0.3), transparent 28%), linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%)',
          color: '#f8fafc',
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'linear-gradient(to bottom right, black 35%, transparent 100%)',
            opacity: 0.35,
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            padding: '56px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 660 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  gap: 10,
                  padding: '12px 18px',
                  borderRadius: 999,
                  backgroundColor: 'rgba(15, 23, 42, 0.72)',
                  border: '1px solid rgba(148, 163, 184, 0.28)',
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: 0.2,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    background: 'linear-gradient(135deg, #22c55e 0%, #38bdf8 100%)',
                    boxShadow: '0 0 0 6px rgba(34, 197, 94, 0.12)',
                  }}
                />
                {SITE.name}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 72,
                    lineHeight: 1,
                    letterSpacing: -3,
                    fontWeight: 800,
                    maxWidth: 640,
                  }}
                >
                  Confiança para escolher energia solar.
                </h1>
                <p
                  style={{
                    margin: 0,
                    fontSize: 32,
                    lineHeight: 1.3,
                    color: '#cbd5e1',
                    maxWidth: 620,
                  }}
                >
                  Empresas verificadas, comparação transparente e contato direto com a equipe da
                  {` `}Avalia Solar.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {['Verificação', 'Transparência', 'Contato direto'].map((label) => (
                  <div
                    key={label}
                    style={{
                      padding: '12px 18px',
                      borderRadius: 999,
                      backgroundColor: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(148, 163, 184, 0.18)',
                      color: '#e2e8f0',
                      fontSize: 24,
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 18,
                width: 340,
                padding: 24,
                borderRadius: 32,
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                boxShadow: '0 30px 80px rgba(2, 6, 23, 0.45)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 18, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 2 }}>
                  Atendimento
                </span>
                <strong style={{ fontSize: 36, lineHeight: 1.1 }}>Fale com Felipe</strong>
                <span style={{ fontSize: 20, color: '#cbd5e1' }}>{CONTACT.hours}</span>
              </div>

              <div style={{ height: 1, backgroundColor: 'rgba(148, 163, 184, 0.2)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18 }}>
                  <span style={{ color: '#94a3b8', fontSize: 18 }}>Canal editorial</span>
                  <span style={{ fontSize: 20, fontWeight: 700 }}>Fale com Felipe</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18 }}>
                  <span style={{ color: '#94a3b8', fontSize: 18 }}>Suporte</span>
                  <span style={{ fontSize: 20, fontWeight: 700 }}>Fale com a equipe</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18 }}>
                  <span style={{ color: '#94a3b8', fontSize: 18 }}>Telefone</span>
                  <span style={{ fontSize: 20, fontWeight: 700 }}>{CONTACT.phone.display}</span>
                </div>
              </div>

              <div style={{ height: 1, backgroundColor: 'rgba(148, 163, 184, 0.2)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 18, color: '#94a3b8' }}>Site oficial</span>
                <span style={{ fontSize: 20, fontWeight: 700 }}>{absoluteUrl('/')}</span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 24,
              fontSize: 20,
              color: '#cbd5e1',
            }}
          >
            <span>{SITE.description}</span>
            <span style={{ color: '#86efac', fontWeight: 700 }}>Brasil</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
