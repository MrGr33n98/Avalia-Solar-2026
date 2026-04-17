import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  spring,
  staticFile,
  Img,
  useVideoConfig,
  Audio,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont();

// ─── TIMING ─────────────────────────────────────────────────────────────────
// Total: 1050 frames = 35s @ 30fps
// Scenes overlap 15 frames (crossfade)
// S1 offset=0   dur=120   ends=120
// S2 offset=105 dur=135   ends=240
// S3 offset=225 dur=135   ends=360
// S4 offset=345 dur=135   ends=480
// S5 offset=465 dur=165   ends=630
// S6 offset=615 dur=195   ends=810
// S7 offset=795 dur=255   ends=1050

const TRANS = 15;

/** Fade in over TRANS frames, hold, fade out over TRANS frames */
const useFade = (duration: number) => {
  const frame = useCurrentFrame();
  return interpolate(
    frame,
    [0, TRANS, duration - TRANS, duration],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
};

// ─── SCENE 1 — HOOK (120 frames = 4s) ───────────────────────────────────────
const Scene1: React.FC<{isVertical: boolean}> = ({isVertical}) => {
  const frame = useCurrentFrame();
  const fade = useFade(120);

  const line1Op = interpolate(frame, [10, 30], [0, 1], {extrapolateRight: 'clamp'});
  const line1Y  = interpolate(frame, [10, 30], [40, 0], {extrapolateRight: 'clamp'});

  const precoBounce = spring({frame: frame - 42, fps: 30, config: {damping: 8, stiffness: 200, mass: 0.8}});
  const precoScale  = interpolate(precoBounce, [0, 1], [0.4, 1]);
  const precoOp     = interpolate(frame, [42, 56], [0, 1], {extrapolateRight: 'clamp'});

  const shieldOp = interpolate(frame, [58, 74], [0, 1], {extrapolateRight: 'clamp'});
  const shieldY  = interpolate(frame, [58, 74], [20, 0], {extrapolateRight: 'clamp'});

  const glowPulse = interpolate(Math.sin(frame * 0.12), [-1, 1], [0.6, 1.0]);

  return (
    <AbsoluteFill style={{opacity: fade}}>
      {/* Background: solar panels */}
      <AbsoluteFill>
        <Img
          src={staticFile('Carrocel-01/background-slide-1.png')}
          style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(3px) brightness(0.35)'}}
        />
      </AbsoluteFill>

      {/* Dark gradient overlay */}
      <AbsoluteFill style={{background: 'linear-gradient(145deg, rgba(0,0,0,0.88) 0%, rgba(8,8,24,0.92) 100%)'}} />

      {/* Lens flare top-right */}
      <div style={{
        position: 'absolute', top: '8%', right: '14%',
        width: 420, height: 420,
        background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 65%)',
        borderRadius: '50%',
        filter: 'blur(2px)',
      }} />
      <div style={{
        position: 'absolute', top: '18%', right: '22%',
        width: 180, height: 180,
        background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)',
        borderRadius: '50%',
      }} />

      {/* Content */}
      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily, gap: 20,
      }}>
        {/* Shield */}
        <div style={{
          opacity: shieldOp,
          transform: `translateY(${shieldY}px)`,
          fontSize: 72,
          filter: `drop-shadow(0 0 ${24 * glowPulse}px rgba(249,115,22,0.9))`,
          marginBottom: 8,
        }}>
          🛡️
        </div>

        {/* Line 1 */}
        <div style={{
          opacity: line1Op,
          transform: `translateY(${line1Y}px)`,
          fontSize: isVertical ? 52 : 58,
          fontWeight: 400,
          color: '#FFFFFF',
          letterSpacing: '-0.5px',
          textShadow: '0 2px 24px rgba(0,0,0,0.6)',
          textAlign: 'center',
          padding: isVertical ? '0 40px' : '0',
        }}>
          A confiança vende mais que o
        </div>

        {/* PREÇO */}
        <div style={{
          opacity: precoOp,
          transform: `scale(${precoScale})`,
          fontSize: isVertical ? 150 : 136,
          fontWeight: 900,
          color: '#F97316',
          letterSpacing: isVertical ? '-8px' : '-5px',
          lineHeight: 1,
          filter: `drop-shadow(0 0 ${48 * glowPulse}px rgba(249,115,22,0.85)) drop-shadow(0 0 ${90 * glowPulse}px rgba(249,115,22,0.4))`,
          textTransform: 'uppercase',
        }}>
          PREÇO.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── SCENE 2 — PROBLEMA (135 frames = 4.5s) ──────────────────────────────────
const Scene2: React.FC<{isVertical: boolean}> = ({isVertical}) => {
  const frame = useCurrentFrame();
  const fade  = useFade(135);

  const bullets = [
    {icon: '✔', text: 'Avaliações',                delay: 32},
    {icon: '⚠', text: 'Reclamações',               delay: 52},
    {icon: '💬', text: 'Experiência de clientes',  delay: 72},
  ];

  const title1Op = interpolate(frame, [10, 28], [0, 1], {extrapolateRight: 'clamp'});
  const title1Y  = interpolate(frame, [10, 28], [35, 0], {extrapolateRight: 'clamp'});
  const title2Op = interpolate(frame, [24, 42], [0, 1], {extrapolateRight: 'clamp'});
  const title2Y  = interpolate(frame, [24, 42], [25, 0], {extrapolateRight: 'clamp'});
  const hlOp     = interpolate(frame, [92, 112], [0, 1], {extrapolateRight: 'clamp'});
  const hlX      = interpolate(frame, [92, 112], [-40, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <AbsoluteFill>
        <Img
          src={staticFile('Carrocel-01/background-slide-1.png')}
          style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(5px) brightness(0.2)'}}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,4,16,0.97) 0%, rgba(8,10,28,0.9) 100%)'}} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: isVertical ? 'center' : 'flex-start', justifyContent: 'center',
        padding: isVertical ? '0 50px' : '0 180px', fontFamily, gap: 20,
      }}>
        <div style={{
          opacity: title1Op, 
          transform: `translateY(${title1Y}px)`, 
          fontSize: isVertical ? 72 : 68, 
          fontWeight: 700, 
          color: '#FFFFFF',
          textAlign: isVertical ? 'center' : 'left',
        }}>
          Seu cliente já decidiu...
        </div>
        <div style={{
          opacity: title2Op, transform: `translateY(${title2Y}px)`,
          fontSize: isVertical ? 50 : 54, fontWeight: 300, color: 'rgba(255,255,255,0.65)', 
          marginBottom: 24, textAlign: isVertical ? 'center' : 'left',
        }}>
          antes de falar com você.
        </div>

        {bullets.map((b, i) => {
          const bOp = interpolate(frame, [b.delay, b.delay + 20], [0, 1], {extrapolateRight: 'clamp'});
          const bX  = interpolate(frame, [b.delay, b.delay + 20], [-64, 0], {extrapolateRight: 'clamp'});
          return (
            <div key={i} style={{
              opacity: bOp, transform: `translateX(${bX}px)`,
              display: 'flex', alignItems: 'center', gap: 22,
              fontSize: 44, color: '#FFFFFF',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 18, padding: '18px 36px',
              border: '1px solid rgba(255,255,255,0.1)',
              minWidth: 480, backdropFilter: 'blur(8px)',
            }}>
              <span style={{fontSize: 38}}>{b.icon}</span>
              <span>{b.text}</span>
            </div>
          );
        })}

        <div style={{
          opacity: hlOp, transform: `translateX(${hlX}px)`, marginTop: 28,
          fontSize: 40, fontWeight: 700, color: '#F97316',
          background: 'rgba(249,115,22,0.1)',
          border: '2px solid rgba(249,115,22,0.55)',
          borderRadius: 14, padding: '18px 36px',
          filter: 'drop-shadow(0 0 22px rgba(249,115,22,0.35))',
        }}>
          Empresas sem reputação são ignoradas.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── SCENE 3 — DOR REAL (135 frames = 4.5s) ──────────────────────────────────
const Scene3: React.FC<{isVertical: boolean}> = ({isVertical}) => {
  const frame = useCurrentFrame();
  const fade  = useFade(135);

  const items = [
    {text: 'Perde leads qualificados',  delay: 22},
    {text: 'Entra em guerra de preço',  delay: 42},
    {text: 'Precisa convencer mais',    delay: 62},
  ];

  const titleOp    = interpolate(frame, [10, 28], [0, 1], {extrapolateRight: 'clamp'});
  const titleY     = interpolate(frame, [10, 28], [32, 0], {extrapolateRight: 'clamp'});
  const hlOp       = interpolate(frame, [88, 108], [0, 1], {extrapolateRight: 'clamp'});
  const pulseGlow  = interpolate(Math.sin(frame * 0.14), [-1, 1], [16, 38]);

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <AbsoluteFill>
        <Img
          src={staticFile('Carrocel-01/background-slide-2.jfif')}
          style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.25) saturate(1.4)'}}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(135deg, rgba(4,8,24,0.92) 0%, rgba(8,16,40,0.88) 100%)'}} />

      {/* Animated network nodes */}
      {[...Array(10)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${8 + i * 9}%`,
          top: `${18 + (i % 4) * 20}%`,
          width: 7, height: 7, borderRadius: '50%',
          background: '#3B82F6',
          opacity: 0.3 + ((Math.sin(frame * 0.04 + i * 1.1) + 1) * 0.25),
          boxShadow: '0 0 14px #3B82F6',
        }} />
      ))}

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: isVertical ? 'center' : 'flex-start', justifyContent: 'center',
        padding: isVertical ? '0 50px' : '0 180px', fontFamily, gap: 22,
      }}>
        <div style={{
          opacity: titleOp, transform: `translateY(${titleY}px)`,
          fontSize: isVertical ? 72 : 70, fontWeight: 800, color: '#FFFFFF', 
          marginBottom: 16, textAlign: isVertical ? 'center' : 'left',
        }}>
          O mercado está filtrando você.
        </div>

        {items.map((item, i) => {
          const iOp = interpolate(frame, [item.delay, item.delay + 18], [0, 1], {extrapolateRight: 'clamp'});
          const iX  = interpolate(frame, [item.delay, item.delay + 18], [-54, 0], {extrapolateRight: 'clamp'});
          return (
            <div key={i} style={{
              opacity: iOp, transform: `translateX(${iX}px)`,
              display: 'flex', alignItems: 'center', gap: 20,
              fontSize: 46, color: 'rgba(255,255,255,0.85)', padding: '10px 0',
            }}>
              <span style={{color: '#EF4444', fontSize: 30, fontWeight: 900, minWidth: 32}}>—</span>
              {item.text}
            </div>
          );
        })}

        <div style={{
          opacity: hlOp, marginTop: 28,
          fontSize: isVertical ? 36 : 42, fontWeight: 800, color: '#FFFFFF',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.14), rgba(249,115,22,0.14))',
          border: '2px solid rgba(239,68,68,0.65)',
          borderRadius: 14, padding: isVertical ? '22px 30px' : '22px 40px',
          filter: `drop-shadow(0 0 ${pulseGlow}px rgba(239,68,68,0.65))`,
          textAlign: 'center',
        }}>
          Falta de confiança = perda de faturamento
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── SCENE 4 — VIRADA (135 frames = 4.5s) ────────────────────────────────────
const Scene4: React.FC<{isVertical: boolean}> = ({isVertical}) => {
  const frame = useCurrentFrame();
  const fade  = useFade(135);

  const items = [
    {icon: '✔', text: 'Confia na sua empresa', delay: 50},
    {icon: '✔', text: 'Vê provas reais',       delay: 68},
  ];

  const starsOp    = interpolate(frame, [72, 92], [0, 1], {extrapolateRight: 'clamp'});
  const starsScale = spring({frame: Math.max(0, frame - 72), fps: 30, config: {damping: 12, stiffness: 150}});
  const hlOp       = interpolate(frame, [100, 118], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <AbsoluteFill style={{background: 'linear-gradient(135deg, #0D1B2A 0%, #1B2A3E 50%, #0D1B2A 100%)'}} />

      {/* Abstract grid overlay */}
      <AbsoluteFill style={{opacity: 0.12}}>
        {[...Array(7)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${i * 15}%`, top: 0, bottom: 0, width: 1,
            background: 'linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.9) 50%, transparent 100%)',
          }} />
        ))}
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', top: `${i * 24}%`, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.9) 50%, transparent 100%)',
          }} />
        ))}
      </AbsoluteFill>

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: isVertical ? 'center' : 'flex-start', justifyContent: 'center',
        padding: isVertical ? '0 50px' : '0 180px', fontFamily, gap: 22,
      }}>
        <div style={{
          opacity: interpolate(frame, [8, 26], [0, 1], {extrapolateRight: 'clamp'}),
          transform: `translateY(${interpolate(frame, [8, 26], [30, 0], {extrapolateRight: 'clamp'})}px)`,
          fontSize: 54, fontWeight: 300, color: 'rgba(255,255,255,0.55)', marginBottom: 6,
        }}>
          Agora imagine o contrário:
        </div>

        <div style={{
          opacity: interpolate(frame, [24, 44], [0, 1], {extrapolateRight: 'clamp'}),
          transform: `translateY(${interpolate(frame, [24, 44], [22, 0], {extrapolateRight: 'clamp'})}px)`,
          fontSize: isVertical ? 62 : 64, fontWeight: 800, color: '#FFFFFF', 
          lineHeight: 1.2, marginBottom: 20, textAlign: isVertical ? 'center' : 'left',
        }}>
          O cliente chega até você<br />
          <span style={{color: '#22C55E'}}>já convencido.</span>
        </div>

        {items.map((item, i) => {
          const iOp = interpolate(frame, [item.delay, item.delay + 18], [0, 1], {extrapolateRight: 'clamp'});
          const iX  = interpolate(frame, [item.delay, item.delay + 18], [-54, 0], {extrapolateRight: 'clamp'});
          return (
            <div key={i} style={{
              opacity: iOp, transform: `translateX(${iX}px)`,
              display: 'flex', alignItems: 'center', gap: 22,
              fontSize: 44, color: '#FFFFFF', padding: '8px 0',
            }}>
              <span style={{color: '#22C55E', fontSize: 36, fontWeight: 900}}>{item.icon}</span>
              {item.text}
            </div>
          );
        })}

        {/* Stars */}
        <div style={{opacity: starsOp, transform: `scale(${starsScale})`, display: 'flex', gap: 10, marginTop: 12}}>
          {[...Array(5)].map((_, i) => (
            <span key={i} style={{fontSize: 52, filter: 'drop-shadow(0 0 14px rgba(255,215,0,0.85))'}}>⭐</span>
          ))}
        </div>

        <div style={{
          opacity: hlOp, marginTop: 12,
          fontSize: 44, fontWeight: 700, color: '#22C55E',
          filter: 'drop-shadow(0 0 18px rgba(34,197,94,0.55))',
        }}>
          Menos esforço. Mais conversão.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── SCENE 5 — SOLUÇÃO (165 frames = 5.5s) ───────────────────────────────────
const Scene5: React.FC<{isVertical: boolean}> = ({isVertical}) => {
  const frame = useCurrentFrame();
  const fade  = useFade(165);

  const features = [
    {icon: '⭐', text: 'Coleta automática de avaliações', delay: 28},
    {icon: '🏛',  text: 'Construção de autoridade',       delay: 48},
    {icon: '🚀', text: 'Prova social validada',            delay: 68},
  ];

  const logos = [
    {file: 'jinko.jpg',          name: 'Jinko',    delay: 82},
    {file: 'longi.jpg',          name: 'LONGi',    delay: 96},
    {file: 'trina.jpg',          name: 'Trina',    delay: 110},
    {file: 'ja_solar.jpg',       name: 'JA Solar', delay: 124},
    {file: 'canadian-solar.jpg', name: 'Canadian', delay: 138},
    {file: 'tongwei.jpg',        name: 'Tongwei',  delay: 152},
  ];

  const titleOp = interpolate(frame, [8, 26], [0, 1], {extrapolateRight: 'clamp'});
  const titleY  = interpolate(frame, [8, 26], [32, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 45% 50%, #100820 0%, #050510 100%)'}} />

      {/* Center glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 700, height: 700,
        background: 'radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 68%)',
        borderRadius: '50%',
      }} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: isVertical ? 'column' : 'row',
        alignItems: 'center', justifyContent: 'center',
        fontFamily, gap: isVertical ? 50 : 80, padding: isVertical ? '0 50px' : '0 100px',
      }}>
        {/* Left: text */}
        <div style={{
          display: 'flex', flexDirection: 'column', 
          gap: 26, flex: 1, 
          alignItems: isVertical ? 'center' : 'flex-start'
        }}>
          <div style={{
            opacity: titleOp, transform: `translateY(${titleY}px)`,
            fontSize: isVertical ? 56 : 62, fontWeight: 800, color: '#FFFFFF', 
            lineHeight: 1.2, textAlign: isVertical ? 'center' : 'left',
          }}>
            É isso que o{' '}
            <span style={{color: '#F97316'}}>Avalia Solar</span>
            {' '}faz.
          </div>

          {features.map((f, i) => {
            const fOp = interpolate(frame, [f.delay, f.delay + 18], [0, 1], {extrapolateRight: 'clamp'});
            const fX  = interpolate(frame, [f.delay, f.delay + 18], [-44, 0], {extrapolateRight: 'clamp'});
            return (
              <div key={i} style={{
                opacity: fOp, transform: `translateX(${fX}px)`,
                display: 'flex', alignItems: 'center', gap: 22,
                fontSize: isVertical ? 32 : 38, color: 'rgba(255,255,255,0.9)',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 18, padding: isVertical ? '14px 24px' : '18px 30px',
                border: '1px solid rgba(249,115,22,0.2)',
                width: isVertical ? '100%' : 'auto',
              }}>
                <span style={{fontSize: 34}}>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            );
          })}
        </div>

        {/* Right: logo grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 18, width: 500,
        }}>
          {logos.map((logo, i) => {
            const lOp    = interpolate(frame, [logo.delay, logo.delay + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            const lScale = spring({frame: Math.max(0, frame - logo.delay), fps: 30, config: {damping: 14, stiffness: 180}});
            return (
              <div key={i} style={{
                opacity: lOp, transform: `scale(${lScale})`,
                background: 'rgba(255,255,255,0.93)',
                borderRadius: 16, padding: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 96,
                boxShadow: '0 4px 28px rgba(0,0,0,0.4)',
              }}>
                <Img
                  src={staticFile(`Carrocel-01/${logo.file}`)}
                  style={{maxWidth: isVertical ? 100 : 116, maxHeight: isVertical ? 60 : 66, objectFit: 'contain'}}
                />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── SCENE 6 — RANKING (195 frames = 6.5s) ───────────────────────────────────
const Scene6: React.FC<{isVertical: boolean}> = ({isVertical}) => {
  const frame = useCurrentFrame();
  const fade  = useFade(195);

  const rankings = [
    {rank: 1, name: 'Jinko Solar',    score: 94.2, logo: 'jinko.jpg',          delay: 18},
    {rank: 2, name: 'LONGi',          score: 93.8, logo: 'longi.jpg',          delay: 36},
    {rank: 3, name: 'Trina Solar',    score: 92.1, logo: 'trina.jpg',          delay: 54},
    {rank: 4, name: 'JA Solar',       score: 91.7, logo: 'ja_solar.jpg',       delay: 72},
    {rank: 5, name: 'Tongwei',        score: 89.4, logo: 'tongwei.jpg',        delay: 90},
    {rank: 6, name: 'Canadian Solar', score: 88.0, logo: 'canadian-solar.jpg', delay: 108},
  ];

  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  const titleOp  = interpolate(frame, [5, 22], [0, 1], {extrapolateRight: 'clamp'});
  const titleY   = interpolate(frame, [5, 22], [26, 0], {extrapolateRight: 'clamp'});
  const footerOp = interpolate(frame, [140, 160], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #080818 0%, #0F1028 100%)'}} />

      {/* Subtle vertical grid lines */}
      <AbsoluteFill style={{opacity: 0.04}}>
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${i * 8.5}%`, top: 0, bottom: 0, width: 1, background: '#FFFFFF',
          }} />
        ))}
      </AbsoluteFill>

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: isVertical ? '0 40px' : '0 140px', fontFamily, gap: 14,
      }}>
        {/* Title */}
        <div style={{
          opacity: titleOp, transform: `translateY(${titleY}px)`,
          fontSize: isVertical ? 46 : 52, fontWeight: 800, color: '#FFFFFF',
          marginBottom: 20, alignSelf: 'flex-start',
        }}>
          Ranking de Fabricantes
          {isVertical ? <br /> : null}
          <span style={{color: '#F97316', marginLeft: isVertical ? 0 : 18}}>2025</span>
        </div>

        {/* Rows */}
        {rankings.map((r, i) => {
          const rOp  = interpolate(frame, [r.delay, r.delay + 18], [0, 1], {extrapolateRight: 'clamp'});
          const rX   = interpolate(frame, [r.delay, r.delay + 18], [-88, 0], {extrapolateRight: 'clamp'});
          const scoreVal = interpolate(frame, [r.delay + 10, r.delay + 52], [0, r.score], {extrapolateRight: 'clamp'});
          // Normalize bar: range 86–96 → 0–100%
          const barPct   = interpolate(frame, [r.delay + 10, r.delay + 52], [0, ((r.score - 86) / 10) * 100], {extrapolateRight: 'clamp'});
          const isTop    = i < 3;

          return (
            <div key={i} style={{
              opacity: rOp, transform: `translateX(${rX}px)`,
              display: 'flex', alignItems: 'center', gap: 22, width: '100%',
              background: isTop ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isTop ? 'rgba(249,115,22,0.32)' : 'rgba(255,255,255,0.09)'}`,
              borderRadius: 18, padding: '14px 26px',
            }}>
              {/* Rank number */}
              <div style={{
                fontSize: 30, fontWeight: 900,
                color: i < 3 ? rankColors[i] : 'rgba(255,255,255,0.38)',
                width: 52, textAlign: 'center',
              }}>
                #{r.rank}
              </div>

              {/* Logo chip */}
              <div style={{
                background: 'rgba(255,255,255,0.93)', borderRadius: 10,
                padding: '6px 12px', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                width: 98, height: 50,
              }}>
                <Img
                  src={staticFile(`Carrocel-01/${r.logo}`)}
                  style={{maxWidth: 80, maxHeight: 38, objectFit: 'contain'}}
                />
              </div>

              {/* Name */}
              <div style={{fontSize: 34, fontWeight: 600, color: '#FFFFFF', width: 220}}>
                {r.name}
              </div>

              {/* Progress bar */}
              <div style={{flex: 1, height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden'}}>
                <div style={{
                  height: '100%', width: `${barPct}%`, borderRadius: 5,
                  background: isTop
                    ? 'linear-gradient(90deg, #F97316, #FBBF24)'
                    : 'linear-gradient(90deg, #3B82F6, #6366F1)',
                  boxShadow: isTop ? '0 0 14px rgba(249,115,22,0.55)' : '0 0 10px rgba(59,130,246,0.45)',
                }} />
              </div>

              {/* Score */}
              <div style={{
                fontSize: isVertical ? 30 : 36, fontWeight: 800,
                color: isTop ? '#F97316' : '#FFFFFF',
                width: isVertical ? 66 : 76, textAlign: 'right',
              }}>
                {scoreVal.toFixed(1)}
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div style={{
          opacity: footerOp, marginTop: 14,
          fontSize: 22, color: 'rgba(255,255,255,0.38)',
          alignSelf: 'flex-start', fontStyle: 'italic',
        }}>
          Baseado em avaliações reais de instaladores
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── SCENE 7 — CTA FINAL (255 frames = 8.5s) ─────────────────────────────────
const Scene7: React.FC<{isVertical: boolean}> = ({isVertical}) => {
  const frame = useCurrentFrame();
  const fade  = useFade(255);

  const logoOp    = interpolate(frame, [18, 38], [0, 1], {extrapolateRight: 'clamp'});
  const logoScale = spring({frame: Math.max(0, frame - 18), fps: 30, config: {damping: 12, stiffness: 120}});

  const titleOp = interpolate(frame, [36, 58], [0, 1], {extrapolateRight: 'clamp'});
  const titleY  = interpolate(frame, [36, 58], [44, 0], {extrapolateRight: 'clamp'});

  const subOp = interpolate(frame, [58, 76], [0, 1], {extrapolateRight: 'clamp'});
  const subY  = interpolate(frame, [58, 76], [22, 0], {extrapolateRight: 'clamp'});

  const btnOp    = interpolate(frame, [82, 102], [0, 1], {extrapolateRight: 'clamp'});
  const btnPulse = interpolate(Math.sin(frame * 0.09), [-1, 1], [0.97, 1.03]);
  const btnGlow  = interpolate(Math.sin(frame * 0.09), [-1, 1], [22, 56]);

  // Particle positions (pre-computed per index)
  const particleData = [
    {lp: 5,  tp: 12}, {lp: 13, tp: 34}, {lp: 21, tp: 8},
    {lp: 29, tp: 56}, {lp: 37, tp: 22}, {lp: 45, tp: 44},
    {lp: 53, tp: 18}, {lp: 61, tp: 68}, {lp: 69, tp: 30},
    {lp: 77, tp: 50}, {lp: 85, tp: 14}, {lp: 93, tp: 40},
  ];

  return (
    <AbsoluteFill style={{opacity: fade}}>
      {/* Green premium gradient */}
      <AbsoluteFill style={{background: 'linear-gradient(135deg, #064E3B 0%, #065F46 38%, #047857 68%, #059669 100%)'}} />

      {/* Radial glow center */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(52,211,153,0.22) 0%, transparent 68%)'}} />

      {/* Subtle particles */}
      <AbsoluteFill style={{overflow: 'hidden'}}>
        {particleData.map((p, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${p.lp}%`, top: `${p.tp}%`,
            width: 5, height: 5, borderRadius: '50%',
            background: 'rgba(255,255,255,0.5)',
            opacity: 0.25 + ((Math.sin(frame * 0.05 + i * 1.2) + 1) * 0.18),
            boxShadow: '0 0 8px rgba(255,255,255,0.4)',
          }} />
        ))}
      </AbsoluteFill>

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily, gap: 28, padding: isVertical ? '0 60px' : '0 160px',
      }}>
        {/* Avalia Solar Logo */}
        <div style={{opacity: logoOp, transform: `scale(${logoScale})`, marginBottom: 8}}>
          <Img
            src={staticFile('Carrocel-01/logo.png')}
            style={{
              height: 88, objectFit: 'contain',
              filter: 'brightness(10) drop-shadow(0 0 24px rgba(255,255,255,0.55))',
            }}
          />
        </div>

        {/* Main headline */}
        <div style={{
          opacity: titleOp, transform: `translateY(${titleY}px)`,
          fontSize: isVertical ? 86 : 96, fontWeight: 900, color: '#FFFFFF',
          textAlign: 'center', letterSpacing: isVertical ? '-2px' : '-3px', lineHeight: 1.05,
          textShadow: '0 4px 28px rgba(0,0,0,0.35)',
        }}>
          Avalie antes de comprar.
        </div>

        {/* Subtitle */}
        <div style={{
          opacity: subOp, transform: `translateY(${subY}px)`,
          fontSize: isVertical ? 40 : 46, fontWeight: 300, color: 'rgba(255,255,255,0.88)',
          textAlign: 'center', letterSpacing: '1px',
        }}>
          Dados reais. Decisão inteligente.
        </div>

        {/* CTA Button */}
        <div style={{
          opacity: btnOp, transform: `scale(${btnPulse})`, marginTop: 8,
          background: '#FFFFFF', borderRadius: 60,
          padding: isVertical ? '22px 60px' : '26px 80px',
          fontSize: isVertical ? 42 : 48, fontWeight: 800, color: '#065F46',
          boxShadow: `0 0 ${btnGlow}px rgba(255,255,255,0.45), 0 10px 48px rgba(0,0,0,0.35)`,
          letterSpacing: '-0.5px',
        }}>
          avaliasolar.com.br
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── ROOT COMPOSITION ─────────────────────────────────────────────────────────
export const PromoVideo35s: React.FC = () => {
  const {width, height} = useVideoConfig();
  const isVertical = height > width;

  return (
    <AbsoluteFill style={{background: '#000000'}}>
      {/* Background Music */}
      <Audio 
        src={staticFile('Carrocel-01/audio-master-video-03.mp3')} 
      />

      {/* S1: 0–120   */}
      <Sequence from={0}   durationInFrames={120}><Scene1 isVertical={isVertical} /></Sequence>
      {/* S2: 105–240 */}
      <Sequence from={105} durationInFrames={135}><Scene2 isVertical={isVertical} /></Sequence>
      {/* S3: 225–360 */}
      <Sequence from={225} durationInFrames={135}><Scene3 isVertical={isVertical} /></Sequence>
      {/* S4: 345–480 */}
      <Sequence from={345} durationInFrames={135}><Scene4 isVertical={isVertical} /></Sequence>
      {/* S5: 465–630 */}
      <Sequence from={465} durationInFrames={165}><Scene5 isVertical={isVertical} /></Sequence>
      {/* S6: 615–810 */}
      <Sequence from={615} durationInFrames={195}><Scene6 isVertical={isVertical} /></Sequence>
      {/* S7: 795–1050 */}
      <Sequence from={795} durationInFrames={255}><Scene7 isVertical={isVertical} /></Sequence>
    </AbsoluteFill>
  );
};
