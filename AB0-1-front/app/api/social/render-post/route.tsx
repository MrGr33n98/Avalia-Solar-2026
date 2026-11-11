import { ImageResponse } from 'next/og';
import { type NextRequest } from 'next/server';

export const runtime = 'edge';

const ALLOWED_FORMATS: Record<string, { width: number; height: number; label: string }> = {
  feed: { width: 1080, height: 1350, label: 'Instagram Feed (4:5)' },
  story: { width: 1080, height: 1920, label: 'Instagram Story (9:16)' },
  square: { width: 1080, height: 1080, label: 'Square Post (1:1)' },
};

export async function GET(request: NextRequest | Request) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get('title') || 'Energia Solar e Mercado Livre de Energia';
    const category = searchParams.get('category') || 'Guia Técnico Oficial';
    const formatKey = (searchParams.get('format') || 'feed').toLowerCase();
    const format = ALLOWED_FORMATS[formatKey] || ALLOWED_FORMATS.feed;
    const author = searchParams.get('author') || 'Equipe Editorial Avalia Solar';

    return new ImageResponse(
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          backgroundColor: '#071a3b',
          backgroundImage:
            'radial-gradient(circle at 90% 10%, rgba(30, 94, 255, 0.45) 0%, transparent 45%), radial-gradient(circle at 10% 90%, rgba(16, 185, 129, 0.25) 0%, transparent 45%), linear-gradient(135deg, #071a3b 0%, #030d22 100%)',
          color: '#f8fafc',
          padding: '80px',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'linear-gradient(rgba(148, 163, 184, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.07) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            opacity: 0.6,
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#FFC82C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 900,
                color: '#071a3b',
              }}
            >
              AS
            </div>
            <span
              style={{
                fontSize: '26px',
                fontWeight: 800,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#bfdbfe',
              }}
            >
              Avalia Solar
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 24px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 200, 44, 0.15)',
              border: '1px solid rgba(255, 200, 44, 0.4)',
              color: '#FFC82C',
              fontSize: '20px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {category}
          </div>
        </div>

        {/* Central Body / Typography */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            zIndex: 1,
            maxWidth: '920px',
            margin: 'auto 0',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '32px',
                borderRadius: '4px',
                backgroundColor: '#3b82f6',
              }}
            />
            <span
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#93c5fd',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              Análise Independente
            </span>
          </div>

          <h1
            style={{
              fontSize: title.length > 60 ? '58px' : '68px',
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#ffffff',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h1>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            paddingTop: '36px',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#94a3b8',
              }}
            >
              {author}
            </span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 500,
                color: '#64748b',
              }}
            >
              Guia auditado e normatizado
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              padding: '12px 28px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
              }}
            />
            <span
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.01em',
              }}
            >
              avaliasolar.com.br
            </span>
          </div>
        </div>
      </div>,
      {
        width: format.width,
        height: format.height,
        headers: {
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      }
    );
  } catch (error) {
    console.error('[API Social Render] Error rendering social image:', error);
    return new Response(JSON.stringify({ error: 'Falha ao renderizar a imagem social' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
