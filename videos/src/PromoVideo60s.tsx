/**
 * Avalia Solar — Vídeo Promocional 60s
 * 1920×1080 · 30fps · 1800 frames
 *
 * 8 cenas baseadas nos slides 01–07 + take do screen recording da plataforma
 *
 * Timeline (offsets = onde cada cena começa; 15 frames de crossfade entre cenas):
 *  S1  0    dur=255   Slide 01 — RANKING 2026 Cover
 *  S2  240  dur=255   Slide 02 — O Risco Real  (R$2,3M)
 *  S3  480  dur=225   Slide 03 — Trust Score™ Metodologia
 *  S4  690  dur=255   Slide 04 — Líderes Absolutos #1–4
 *  S5  930  dur=225   Slide 05 — Forte Atuação BR #5–6
 *  S6  1140 dur=255   Platform TAKE — Screen Recording
 *  S7  1380 dur=225   Slide 06 — 5 Perguntas
 *  S8  1590 dur=210   Slide 07 — CTA Final
 *  Total = 1800 frames = 60s ✓
 */

import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  spring,
  staticFile,
  Img,
  Video,
  useVideoConfig,
  Audio,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont();

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const TRANS       = 15;
const C_ORANGE    = '#F97316';
const C_GREEN_BR  = '#22C55E';
const C_GREEN_CTG = '#065F46';
const C_TEAL      = '#0D1F1A';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const useFade = (duration: number) => {
  const frame = useCurrentFrame();
  return interpolate(
    frame,
    [0, TRANS, duration - TRANS, duration],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
};

const useCounter = (from: number, to: number, startFrame: number, endFrame: number): number => {
  const frame = useCurrentFrame();
  return interpolate(frame, [startFrame, endFrame], [from, to], {extrapolateRight: 'clamp'});
};

/** Ken Burns + dark overlay */
const SceneBg: React.FC<{
  src: string;
  duration: number;
  brightness?: number;
  overlay?: number;
  /** set true to zoom OUT instead of in */
  zoomOut?: boolean;
}> = ({src, duration, brightness = 0.55, overlay = 0.72, zoomOut = false}) => {
  const frame = useCurrentFrame();
  const scale = zoomOut
    ? interpolate(frame, [0, duration], [1.09, 1.0], {extrapolateRight: 'clamp'})
    : interpolate(frame, [0, duration], [1.0, 1.09], {extrapolateRight: 'clamp'});
  const tx = interpolate(frame, [0, duration], [0, zoomOut ? 12 : -12], {extrapolateRight: 'clamp'});
  const ty = interpolate(frame, [0, duration], [0, zoomOut ? 6 : -6], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img
        src={src}
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          transform: `scale(${scale}) translate(${tx}px,${ty}px)`,
          transformOrigin: 'center center',
          filter: `brightness(${brightness})`,
        }}
      />
      <AbsoluteFill style={{background: `rgba(0,0,0,${overlay})`}} />
    </AbsoluteFill>
  );
};

/** Animated slide-in label (small caps badge) */
const Badge: React.FC<{text: string; color?: string; delayFrame?: number; isVertical?: boolean}> = ({
  text, color = C_ORANGE, delayFrame = 8, isVertical = false
}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [delayFrame, delayFrame + 18], [0, 1], {extrapolateRight: 'clamp'});
  const y  = interpolate(frame, [delayFrame, delayFrame + 18], [14, 0], {extrapolateRight: 'clamp'});
  return (
    <div style={{
      opacity: op, transform: `translateY(${y}px)`,
      fontSize: isVertical ? 18 : 22, fontWeight: 700, letterSpacing: isVertical ? 3 : 4,
      color, textTransform: 'uppercase',
      borderBottom: `2px solid ${color}`,
      paddingBottom: 4, display: 'inline-block',
      marginBottom: 20,
    }}>
      {text}
    </div>
  );
};

/** Animated progress bar row (for rankings) */
const RankRow: React.FC<{
  rank: number;
  name: string;
  score: number;
  logo: string;
  delay: number;
  isTop?: boolean;
  rankColor?: string;
  detail?: string;
  isVertical?: boolean;
}> = ({rank, name, score, logo, delay, isTop = false, rankColor = 'rgba(255,255,255,0.35)', detail, isVertical = false}) => {
  const frame = useCurrentFrame();
  const op      = interpolate(frame, [delay, delay + 18], [0, 1], {extrapolateRight: 'clamp'});
  const x       = interpolate(frame, [delay, delay + 18], [-100, 0], {extrapolateRight: 'clamp'});
  const scoreV  = interpolate(frame, [delay + 12, delay + 55], [0, score], {extrapolateRight: 'clamp'});
  const barW    = interpolate(frame, [delay + 12, delay + 55], [0, ((score - 85) / 12) * 100], {extrapolateRight: 'clamp'});

  return (
    <div style={{
      opacity: op, transform: `translateX(${x}px)`,
      display: 'flex', alignItems: 'center', gap: isVertical ? 12 : 20,
      background: isTop ? 'rgba(249,115,22,0.09)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${isTop ? 'rgba(249,115,22,0.35)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: isVertical ? 12 : 16, padding: isVertical ? '10px 16px' : '14px 22px', width: '100%',
    }}>
      <div style={{fontSize: isVertical ? 22 : 28, fontWeight: 900, color: rankColor, width: isVertical ? 36 : 44, textAlign: 'center'}}>
        #{rank}
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.93)', borderRadius: 10,
        padding: '5px 10px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', width: isVertical ? 70 : 88, height: isVertical ? 36 : 46,
      }}>
        <Img src={staticFile(`Carrocel-01/${logo}`)} style={{maxWidth: isVertical ? 54 : 70, maxHeight: isVertical ? 28 : 34, objectFit: 'contain'}} />
      </div>
      <div style={{flex: 1}}>
        <div style={{fontSize: isVertical ? 24 : 30, fontWeight: 700, color: '#FFFFFF'}}>{name}</div>
        {detail && <div style={{fontSize: isVertical ? 14 : 18, color: 'rgba(255,255,255,0.45)', marginTop: 2}}>{detail}</div>}
      </div>
      {!isVertical && (
        <div style={{width: 240, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden'}}>
          <div style={{
            height: '100%', width: `${barW}%`, borderRadius: 4,
            background: isTop ? 'linear-gradient(90deg,#F97316,#FBBF24)' : 'linear-gradient(90deg,#22C55E,#16A34A)',
            boxShadow: isTop ? '0 0 12px rgba(249,115,22,0.5)' : '0 0 10px rgba(34,197,94,0.45)',
          }} />
        </div>
      )}
      <div style={{fontSize: isVertical ? 28 : 34, fontWeight: 800, color: isTop ? C_ORANGE : C_GREEN_BR, width: isVertical ? 56 : 68, textAlign: 'right'}}>
        {scoreV.toFixed(1)}
      </div>
    </div>
  );
};

// ─── SCENE 1 — RANKING 2026 COVER (255 frames) ───────────────────────────────
// Baseado no Slide 01: "Top 10 Fabricantes de Painéis Solares do Mundo"
const Scene1Cover: React.FC<{isVertical: boolean}> = ({isVertical}) => {
  const frame = useCurrentFrame();
  const fade  = useFade(255);
  const DUR   = 255;

  const h1Scale = spring({frame: frame - 28, fps: 30, config: {damping: 10, stiffness: 160, mass: 0.9}});
  const h1Op    = interpolate(frame, [28, 44], [0, 1], {extrapolateRight: 'clamp'});
  const subOp   = interpolate(frame, [58, 76], [0, 1], {extrapolateRight: 'clamp'});
  const subY    = interpolate(frame, [58, 76], [22, 0], {extrapolateRight: 'clamp'});
  const ctaOp   = interpolate(frame, [90, 108], [0, 1], {extrapolateRight: 'clamp'});

  // Animated year counter: 2025 → 2026
  const year = Math.round(interpolate(frame, [12, 38], [2025, 2026], {extrapolateRight: 'clamp'}));

  return (
    <AbsoluteFill style={{opacity: fade, fontFamily}}>
      <SceneBg src={staticFile('Carrocel-01/background-slide-1.png')} duration={DUR} brightness={0.45} overlay={0.68} />

      {/* Gold lens flare top-right */}
      <div style={{
        position: 'absolute', top: '6%', right: '8%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(251,191,36,0.14) 0%, transparent 65%)',
        borderRadius: '50%',
      }} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: isVertical ? 'center' : 'flex-start', justifyContent: 'center',
        padding: isVertical ? '0 50px' : '0 180px', gap: 8,
      }}>
        <Badge text={`Ranking ${year}`} color={C_ORANGE} delayFrame={8} isVertical={isVertical} />

        {/* Main headline */}
        <div style={{
          opacity: h1Op,
          transform: `scale(${interpolate(h1Scale, [0, 1], [0.92, 1])})`,
          transformOrigin: isVertical ? 'center center' : 'left center',
          fontSize: isVertical ? 72 : 84, fontWeight: 900, color: '#FFFFFF',
          lineHeight: 1.08, letterSpacing: '-2px',
          maxWidth: isVertical ? '100%' : 900,
          textAlign: isVertical ? 'center' : 'left',
        }}>
          Top 10 Fabricantes<br />
          de Painéis Solares<br />
          <span style={{color: C_ORANGE}}>do Mundo</span>
        </div>

        {/* Subtitle */}
        <div style={{
          opacity: subOp, transform: `translateY(${subY}px)`,
          fontSize: isVertical ? 32 : 36, fontWeight: 300, color: 'rgba(255,255,255,0.72)',
          marginTop: 24, maxWidth: isVertical ? '100%' : 820, lineHeight: 1.5,
          textAlign: isVertical ? 'center' : 'left',
        }}>
          Quem realmente entrega{' '}
          <span style={{color: '#FFFFFF', fontWeight: 600}}>qualidade, prazo e suporte</span>
          {' '}no mercado brasileiro em 2026?
        </div>

        {/* Platform badge */}
        <div style={{
          opacity: ctaOp, marginTop: 40,
          display: 'flex', alignItems: 'center', gap: 16,
          background: 'rgba(249,115,22,0.15)',
          border: '1.5px solid rgba(249,115,22,0.55)',
          borderRadius: 50, padding: '14px 32px',
        }}>
          <Img
            src={staticFile('Carrocel-01/logo.png')}
            style={{height: 32, objectFit: 'contain', filter: 'brightness(10)'}}
          />
          <span style={{fontSize: 28, fontWeight: 700, color: '#FFFFFF'}}>avaliasolar.com.br</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── SCENE 2 — O RISCO REAL (255 frames) ─────────────────────────────────────
// Baseado no Slide 02: "R$2,3M perdidos por escolher o fabricante errado"
const Scene2Risco: React.FC<{isVertical: boolean}> = ({isVertical}) => {
  const frame = useCurrentFrame();
  const fade  = useFade(255);
  const DUR   = 255;

  const titleOp = interpolate(frame, [10, 28], [0, 1], {extrapolateRight: 'clamp'});
  const titleY  = interpolate(frame, [10, 28], [36, 0], {extrapolateRight: 'clamp'});
  const bodyOp  = interpolate(frame, [36, 54], [0, 1], {extrapolateRight: 'clamp'});

  // Stats counters
  const eff  = useCounter(0, 23,  70, 130);
  const grt  = useCounter(0, 67,  80, 140);
  const mnt  = useCounter(0, 42,  90, 150);  // 4.2 = displayed as 42/10

  const stat1Op = interpolate(frame, [68, 88], [0, 1], {extrapolateRight: 'clamp'});
  const stat2Op = interpolate(frame, [86, 106], [0, 1], {extrapolateRight: 'clamp'});
  const stat3Op = interpolate(frame, [104, 124], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{opacity: fade, fontFamily}}>
      {/* Dark teal background matching slide 02 */}
      <AbsoluteFill style={{background: `linear-gradient(145deg, ${C_TEAL} 0%, #0A1A14 50%, #0D2018 100%)`}} />
      <SceneBg src={staticFile('Carrocel-01/background-slide-2.jfif')} duration={DUR} brightness={0.2} overlay={0.82} />

      {/* Red glow left */}
      <div style={{
        position: 'absolute', top: '30%', left: '-5%',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 65%)',
        borderRadius: '50%',
      }} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: isVertical ? 'center' : 'flex-start', justifyContent: 'center',
        padding: isVertical ? '0 50px' : '0 180px', gap: 20,
      }}>
        <Badge text="O Risco Real" color="#EF4444" delayFrame={8} isVertical={isVertical} />

        <div style={{
          opacity: titleOp, transform: `translateY(${titleY}px)`,
          fontSize: isVertical ? 62 : 72, fontWeight: 900, color: '#FFFFFF',
          lineHeight: 1.1, maxWidth: isVertical ? '100%' : 1000, letterSpacing: '-1.5px',
          textAlign: isVertical ? 'center' : 'left',
        }}>
          <span style={{color: '#EF4444'}}>R$2,3M</span> perdidos por<br />
          escolher o fabricante errado
        </div>

        <div style={{
          opacity: bodyOp,
          fontSize: isVertical ? 28 : 32, fontWeight: 300, color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.55, maxWidth: isVertical ? '100%' : 860, marginBottom: 12,
          textAlign: isVertical ? 'center' : 'left',
        }}>
          Degradação acima do prometido. Garantia que não é honrada.
          Suporte técnico inexistente no Brasil.{' '}
          <span style={{color: 'rgba(255,255,255,0.9)', fontStyle: 'italic'}}>Isso aconteceu com um integrador em SP em 2024.</span>
        </div>

        {/* Stats row */}
        <div style={{display: 'flex', flexDirection: isVertical ? 'column' : 'row', gap: 28, marginTop: 12, width: isVertical ? '100%' : 'auto'}}>
          {[
            {op: stat1Op, value: `-${eff.toFixed(0)}%`, label: 'eficiência real vs prometida', color: '#EF4444'},
            {op: stat2Op, value: `${grt.toFixed(0)}%`,  label: 'garantias não honradas',       color: '#F97316'},
            {op: stat3Op, value: `${(mnt / 10).toFixed(1)}x`, label: 'custo de manutenção extra', color: '#FBBF24'},
          ].map((s, i) => (
            <div key={i} style={{
              opacity: s.op,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid rgba(255,255,255,0.1)`,
              borderRadius: 20, padding: isVertical ? '18px 30px' : '28px 40px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              minWidth: isVertical ? '100%' : 240,
            }}>
              <span style={{fontSize: isVertical ? 50 : 62, fontWeight: 900, color: s.color, letterSpacing: '-2px'}}>{s.value}</span>
              <span style={{fontSize: isVertical ? 18 : 22, color: 'rgba(255,255,255,0.55)', textAlign: 'center'}}>{s.label}</span>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── SCENE 3 — TRUST SCORE™ METODOLOGIA (225 frames) ─────────────────────────
// Baseado no Slide 03
const Scene3TrustScore: React.FC<{isVertical: boolean}> = ({isVertical}) => {
  const frame = useCurrentFrame();
  const fade  = useFade(225);

  const criteria = [
    {icon: '⚡', title: 'Eficiência Real',      desc: 'Performance medida por instaladores verificados',  delay: 48},
    {icon: '🛡️', title: 'Garantia Honrada',      desc: '% de garantias cumpridas no prazo',               delay: 68},
    {icon: '🇧🇷', title: 'Suporte no Brasil',    desc: 'Presença local e tempo de resposta',               delay: 88},
    {icon: '⭐', title: 'Reputação de Mercado', desc: 'Dados verificados por instaladores',               delay: 108},
  ];

  const tsScale = spring({frame: frame - 20, fps: 30, config: {damping: 11, stiffness: 140}});

  return (
    <AbsoluteFill style={{opacity: fade, fontFamily}}>
      {/* Green background matching slide 03 */}
      <AbsoluteFill style={{background: 'linear-gradient(145deg, #053D2B 0%, #065F46 45%, #047857 100%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(52,211,153,0.18) 0%, transparent 60%)'}} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: isVertical ? 'column' : 'row',
        alignItems: 'center', justifyContent: 'center',
        padding: isVertical ? '0 50px' : '0 140px', gap: isVertical ? 40 : 100,
      }}>
        {/* Left: Trust Score branding */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 16, flex: isVertical ? '0' : '0 0 420px', alignItems: isVertical ? 'center' : 'flex-start'}}>
          <Badge text="Nossa Metodologia" color="#34D399" delayFrame={8} isVertical={isVertical} />
          <div style={{
            opacity: interpolate(frame, [18, 36], [0, 1], {extrapolateRight: 'clamp'}),
            transform: `scale(${interpolate(tsScale, [0, 1], [0.88, 1])})`,
            transformOrigin: isVertical ? 'center' : 'left center',
            textAlign: isVertical ? 'center' : 'left',
          }}>
            <div style={{fontSize: isVertical ? 72 : 88, fontWeight: 900, color: '#FFFFFF', lineHeight: 1, letterSpacing: '-3px'}}>
              Trust<br />
              <span style={{color: '#34D399'}}>Score</span>
              <span style={{fontSize: 48, color: '#34D399'}}>™</span>
            </div>
          </div>
          <div style={{
            opacity: interpolate(frame, [38, 56], [0, 1], {extrapolateRight: 'clamp'}),
            fontSize: isVertical ? 24 : 28, fontWeight: 300, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5,
            textAlign: isVertical ? 'center' : 'left',
          }}>
            Avaliação 360° com dados reais<br />do mercado brasileiro
          </div>
        </div>

        {/* Right: Criteria */}
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 18}}>
          {criteria.map((c, i) => {
            const op = interpolate(frame, [c.delay, c.delay + 20], [0, 1], {extrapolateRight: 'clamp'});
            const x  = interpolate(frame, [c.delay, c.delay + 20], [60, 0], {extrapolateRight: 'clamp'});
            return (
              <div key={i} style={{
                opacity: op, transform: `translateX(${x}px)`,
                display: 'flex', alignItems: 'center', gap: 22,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 18, padding: '18px 28px',
              }}>
                <span style={{fontSize: 36}}>{c.icon}</span>
                <div>
                  <div style={{fontSize: 30, fontWeight: 700, color: '#FFFFFF'}}>{c.title}</div>
                  <div style={{fontSize: 20, color: 'rgba(255,255,255,0.55)', marginTop: 4}}>{c.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── SCENE 4 — LÍDERES ABSOLUTOS #1–4 (255 frames) ───────────────────────────
// Baseado no Slide 04
const Scene4Lideres: React.FC<{isVertical: boolean}> = ({isVertical}) => {
  const frame = useCurrentFrame();
  const fade  = useFade(255);
  const DUR   = 255;

  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32', 'rgba(255,255,255,0.45)'];
  const leaders = [
    {rank:1, name:'Jinko Solar',  score:94.2, logo:'jinko.jpg',    detail:'China · 130 GW/ano',            delay:30},
    {rank:2, name:'LONGi Solar',  score:93.8, logo:'longi.jpg',    detail:'China · Hi-MO 9 Series',        delay:52},
    {rank:3, name:'Trina Solar',  score:92.1, logo:'trina.jpg',    detail:'China · Vertex Series',         delay:74},
    {rank:4, name:'JA Solar',     score:91.7, logo:'ja_solar.jpg', detail:'China · DeepBlue 4.0',          delay:96},
  ];

  return (
    <AbsoluteFill style={{opacity: fade, fontFamily}}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #060614 0%, #0C0C20 100%)'}} />
      <SceneBg src={staticFile('Carrocel-01/background-slide-3.jfif')} duration={DUR} brightness={0.15} overlay={0.9} />

      {/* Orange glow top */}
      <div style={{
        position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 500,
        background: 'radial-gradient(ellipse, rgba(249,115,22,0.1) 0%, transparent 65%)',
        borderRadius: '50%',
      }} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: isVertical ? 'center' : 'center', justifyContent: 'center',
        padding: isVertical ? '0 40px' : '0 140px', gap: 16,
      }}>
        <div style={{width: '100%', marginBottom: 12, textAlign: isVertical ? 'center' : 'left'}}>
          <Badge text="#1 ao #4 — Top Global" color={C_ORANGE} delayFrame={8} isVertical={isVertical} />
          <div style={{
            opacity: interpolate(frame, [12, 30], [0, 1], {extrapolateRight: 'clamp'}),
            transform: `translateY(${interpolate(frame, [12, 30], [28, 0], {extrapolateRight: 'clamp'})}px)`,
            fontSize: isVertical ? 56 : 68, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-1.5px',
          }}>
            Os Líderes Absolutos
          </div>
          <div style={{
            opacity: interpolate(frame, [22, 40], [0, 1], {extrapolateRight: 'clamp'}),
            fontSize: 28, color: 'rgba(255,255,255,0.55)', marginTop: 6,
          }}>
            Transforme a AvaliaSolar no seu aliado estratégico de vendas
          </div>
        </div>

        {leaders.map((r) => (
          <RankRow
            key={r.rank}
            rank={r.rank}
            name={r.name}
            score={r.score}
            logo={r.logo}
            delay={r.delay}
            isTop={r.rank <= 3}
            rankColor={rankColors[r.rank - 1]}
            detail={r.detail}
            isVertical={isVertical}
          />
        ))}

        {/* Footer */}
        <div style={{
          opacity: interpolate(frame, [120, 140], [0, 1], {extrapolateRight: 'clamp'}),
          marginTop: 8, fontSize: 20, color: 'rgba(255,255,255,0.35)',
          alignSelf: 'flex-start', fontStyle: 'italic',
        }}>
          Score baseado em avaliações verificadas de instaladores
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── SCENE 5 — FORTE ATUAÇÃO BR #5–6 (225 frames) ────────────────────────────
// Baseado no Slide 05
const Scene5Brasil: React.FC<{isVertical: boolean}> = ({isVertical}) => {
  const frame = useCurrentFrame();
  const fade  = useFade(225);
  const DUR   = 225;

  const brasil = [
    {rank:5, name:'Tongwei Solar',   score:89.4, logo:'tongwei.jpg',        detail:'China · Células HPBC',  delay:28},
    {rank:6, name:'Canadian Solar',  score:88.9, logo:'canadian-solar.jpg', detail:'Canada · HiKu7 Series', delay:52},
  ];

  const extraOp = interpolate(frame, [80, 100], [0, 1], {extrapolateRight: 'clamp'});
  const extraY  = interpolate(frame, [80, 100], [20, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{opacity: fade, fontFamily}}>
      <AbsoluteFill style={{background: `linear-gradient(145deg, #050E14 0%, #0B1A24 100%)`}} />
      <SceneBg src={staticFile('Carrocel-01/background-slide-4.jfif')} duration={DUR} brightness={0.25} overlay={0.82} />

      {/* Green glow */}
      <div style={{
        position: 'absolute', bottom: '10%', right: '5%',
        width: 700, height: 700,
        background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 65%)',
        borderRadius: '50%',
      }} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: isVertical ? 'center' : 'flex-start', justifyContent: 'center',
        padding: isVertical ? '0 40px' : '0 180px', gap: 18,
      }}>
        <Badge text="#5 ao #6 — Forte Presença BR" color={C_GREEN_BR} delayFrame={8} isVertical={isVertical} />

        <div style={{
          opacity: interpolate(frame, [12, 30], [0, 1], {extrapolateRight: 'clamp'}),
          transform: `translateY(${interpolate(frame, [12, 30], [28, 0], {extrapolateRight: 'clamp'})}px)`,
          fontSize: isVertical ? 56 : 68, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-1.5px', marginBottom: 8,
          textAlign: isVertical ? 'center' : 'left',
        }}>
          Forte Atuação no Brasil
        </div>

        <div style={{
          opacity: interpolate(frame, [22, 40], [0, 1], {extrapolateRight: 'clamp'}),
          fontSize: isVertical ? 26 : 30, color: 'rgba(255,255,255,0.55)', marginBottom: 16,
          textAlign: isVertical ? 'center' : 'left',
        }}>
          Distribuidores, estoque local e suporte técnico em PT
        </div>

        {brasil.map((r) => (
          <RankRow
            key={r.rank}
            rank={r.rank}
            name={r.name}
            score={r.score}
            logo={r.logo}
            delay={r.delay}
            isTop={false}
            rankColor={C_GREEN_BR}
            detail={r.detail}
            isVertical={isVertical}
          />
        ))}

        {/* Rankings #7–10 mention */}
        <div style={{
          opacity: extraOp, transform: `translateY(${extraY}px)`,
          marginTop: 16, width: '100%',
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.28)',
          borderRadius: 16, padding: isVertical ? '14px 20px' : '20px 28px',
        }}>
          <div style={{fontSize: isVertical ? 18 : 22, fontWeight: 700, color: C_GREEN_BR, marginBottom: 8, textAlign: isVertical ? 'center' : 'left'}}>
            RANKINGS #7 AO #10
          </div>
          <div style={{fontSize: isVertical ? 22 : 26, color: 'rgba(255,255,255,0.72)', textAlign: isVertical ? 'center' : 'left'}}>
            BYD, Risen Energy, Astronergy e Seraphim completam o top 10.
            {' '}<span style={{color: C_GREEN_BR}}>Veja análise completa com dados de campo no próximo slide.</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── SCENE 6 — PLATFORM TAKE (255 frames) ────────────────────────────────────
// Screen recording da plataforma Avalia Solar
const Scene6Platform: React.FC<{isVertical: boolean}> = ({isVertical}) => {
  const frame = useCurrentFrame();
  const fade  = useFade(255);
  const DUR   = 255;

  const videoScale = interpolate(frame, [TRANS, 60], [0.88, 1.0], {extrapolateRight: 'clamp'});
  const videoOp    = interpolate(frame, [TRANS, 50], [0, 1], {extrapolateRight: 'clamp'});

  const labelOp  = interpolate(frame, [55, 72], [0, 1], {extrapolateRight: 'clamp'});
  const labelX   = interpolate(frame, [55, 72], [30, 0], {extrapolateRight: 'clamp'});

  // Pulse on "AO VIVO" dot
  const livePulse = interpolate(Math.sin(frame * 0.18), [-1, 1], [0.5, 1.0]);

  return (
    <AbsoluteFill style={{opacity: fade, fontFamily}}>
      {/* Dark studio background */}
      <AbsoluteFill style={{background: 'linear-gradient(145deg, #050510 0%, #0A0A1A 100%)'}} />

      {/* Subtle grid */}
      <AbsoluteFill style={{opacity: 0.06}}>
        {[...Array(10)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${i * 10}%`, top: 0, bottom: 0, width: 1, background: '#FFFFFF',
          }} />
        ))}
      </AbsoluteFill>

      {/* Platform video — scaled & centered */}
      <AbsoluteFill style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isVertical ? '40px 30px 80px' : '40px 80px 80px',
      }}>
        {/* Browser frame mockup */}
        <div style={{
          opacity: videoOp,
          transform: `scale(${videoScale})`,
          width: '100%', maxWidth: 1520,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 32px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)',
        }}>
          {/* Browser chrome bar */}
          <div style={{
            background: '#1A1A2E',
            padding: '12px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            {/* Traffic lights */}
            {['#FF5F57','#FEBC2E','#28C840'].map((c) => (
              <div key={c} style={{width: 14, height: 14, borderRadius: '50%', background: c}} />
            ))}
            {/* Address bar */}
            <div style={{
              flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 8,
              padding: '6px 18px', display: 'flex', alignItems: 'center', gap: 10,
              maxWidth: 600, margin: '0 auto',
            }}>
              <span style={{fontSize: 16, color: '#22C55E'}}>🔒</span>
              <span style={{fontSize: 18, color: 'rgba(255,255,255,0.7)', fontFamily}}>
                avaliasolar.com.br
              </span>
            </div>
          </div>

          {/* Screen recording content */}
          <div style={{position: 'relative', background: '#000', aspectRatio: isVertical ? '9/16' : '16/9', overflow: 'hidden'}}>
            <Video
              src={staticFile('Carrocel-01/Screen Recording 2026-04-10 at 10.01.11.mov')}
              startFrom={0}
              volume={0}
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
            />
          </div>
        </div>
      </AbsoluteFill>

      {/* AO VIVO badge — bottom-left */}
      <div style={{
        position: 'absolute', bottom: 38, left: isVertical ? 40 : 80,
        opacity: labelOp, transform: `translateX(${labelX}px)`,
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 50, padding: '10px 24px',
      }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%', background: '#EF4444',
          boxShadow: `0 0 ${16 * livePulse}px rgba(239,68,68,0.9)`,
        }} />
        <span style={{fontSize: isVertical ? 16 : 20, fontWeight: 700, color: '#FFFFFF', letterSpacing: 2}}>
          PLATAFORMA AO VIVO
        </span>
      </div>

      {/* Avalia Solar watermark — bottom-right */}
      <div style={{
        position: 'absolute', bottom: 38, right: isVertical ? 40 : 80,
        opacity: labelOp,
      }}>
        <Img
          src={staticFile('Carrocel-01/logo.png')}
          style={{height: 36, objectFit: 'contain', filter: 'brightness(10) opacity(0.6)'}}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 7 — 5 PERGUNTAS QUE SALVAM PROJETOS (225 frames) ──────────────────
// Baseado no Slide 06
const Scene7Perguntas: React.FC<{isVertical: boolean}> = ({isVertical}) => {
  const frame = useCurrentFrame();
  const fade  = useFade(225);
  const DUR   = 225;

  const perguntas = [
    {num:'01', q:'Qual a degradação anual garantida em contrato?',    hint:'Exija lifetime warranty de pelo menos 25 anos', delay:36},
    {num:'02', q:'Há representante técnico no Brasil?',               hint:'Suporte local reduz tempo de garantia em 4x',   delay:60},
    {num:'03', q:'Tem certificação IEC + INMETRO?',                    hint:'Obrigatório para conexão à rede',               delay:84},
    {num:'04', q:'Quais integradores já usaram no BR?',               hint:'Peça referências verificáveis — ou consulte a AvaliaSolar', delay:108},
  ];

  return (
    <AbsoluteFill style={{opacity: fade, fontFamily}}>
      <SceneBg src={staticFile('Carrocel-01/background-slide-1.png')} duration={DUR} brightness={0.35} overlay={0.82} zoomOut />

      {/* Subtle warm overlay */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,10,20,0.4) 0%, rgba(249,115,22,0.04) 100%)'}} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: isVertical ? 'center' : 'flex-start', justifyContent: 'center',
        padding: isVertical ? '0 50px' : '0 180px', gap: 18,
      }}>
        <Badge text="Antes de Comprar" color={C_ORANGE} delayFrame={8} isVertical={isVertical} />

        <div style={{
          opacity: interpolate(frame, [14, 32], [0, 1], {extrapolateRight: 'clamp'}),
          transform: `translateY(${interpolate(frame, [14, 32], [28, 0], {extrapolateRight: 'clamp'})}px)`,
          fontSize: isVertical ? 58 : 72, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-2px', marginBottom: 12,
          textAlign: isVertical ? 'center' : 'left',
        }}>
          5 Perguntas que<br />
          <span style={{color: C_ORANGE}}>Salvam Projetos</span>
        </div>

        {perguntas.map((p, i) => {
          const op = interpolate(frame, [p.delay, p.delay + 20], [0, 1], {extrapolateRight: 'clamp'});
          const y  = interpolate(frame, [p.delay, p.delay + 20], [22, 0], {extrapolateRight: 'clamp'});
          return (
            <div key={i} style={{
              opacity: op, transform: `translateY(${y}px)`,
              display: 'flex', alignItems: 'flex-start', gap: i ? 22 : 22, width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: isVertical ? 12 : 16, padding: isVertical ? '12px 18px' : '16px 26px',
            }}>
              <span style={{
                fontSize: isVertical ? 28 : 36, fontWeight: 900, color: C_ORANGE,
                minWidth: isVertical ? 36 : 48,
              }}>{p.num}</span>
              <div>
                <div style={{fontSize: isVertical ? 24 : 30, fontWeight: 700, color: '#FFFFFF'}}>{p.q}</div>
                <div style={{fontSize: isVertical ? 16 : 20, color: 'rgba(255,255,255,0.5)', marginTop: 4}}>{p.hint}</div>
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── SCENE 8 — CTA FINAL (210 frames) ────────────────────────────────────────
// Baseado no Slide 07 — "Avalie antes de comprar."
const Scene8CTA: React.FC<{isVertical: boolean}> = ({isVertical}) => {
  const frame = useCurrentFrame();
  const fade  = useFade(210);

  const logoOp    = interpolate(frame, [12, 30], [0, 1], {extrapolateRight: 'clamp'});
  const logoScale = spring({frame: Math.max(0, frame - 12), fps: 30, config: {damping: 11, stiffness: 110}});

  const h1Op = interpolate(frame, [30, 50], [0, 1], {extrapolateRight: 'clamp'});
  const h1Y  = interpolate(frame, [30, 50], [44, 0], {extrapolateRight: 'clamp'});

  const subOp = interpolate(frame, [52, 70], [0, 1], {extrapolateRight: 'clamp'});
  const subY  = interpolate(frame, [52, 70], [22, 0], {extrapolateRight: 'clamp'});

  const btnOp    = interpolate(frame, [74, 92], [0, 1], {extrapolateRight: 'clamp'});
  const btnPulse = interpolate(Math.sin(frame * 0.1), [-1, 1], [0.97, 1.035]);
  const btnGlow  = interpolate(Math.sin(frame * 0.1), [-1, 1], [20, 52]);

  const tagsOp = interpolate(frame, [108, 126], [0, 1], {extrapolateRight: 'clamp'});
  const tags = ['#EnergiaSolar','#FabricantesSolares','#AvaliaSolar','#TrustScore'];

  // Particles
  const ptData = [
    {l:5,  t:14}, {l:14, t:36}, {l:23, t:8},  {l:32, t:60},
    {l:42, t:22}, {l:51, t:48}, {l:60, t:16}, {l:70, t:72},
    {l:79, t:32}, {l:88, t:54}, {l:92, t:10}, {l:97, t:44},
  ];

  return (
    <AbsoluteFill style={{opacity: fade, fontFamily}}>
      {/* Green gradient — matching slide 07 */}
      <AbsoluteFill style={{background: `linear-gradient(145deg, #053D2B 0%, ${C_GREEN_CTG} 45%, #059669 100%)`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, rgba(52,211,153,0.24) 0%, transparent 65%)'}} />

      {/* Particles */}
      <AbsoluteFill style={{overflow: 'hidden'}}>
        {ptData.map((p, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${p.l}%`, top: `${p.t}%`,
            width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.55)',
            opacity: 0.2 + ((Math.sin(frame * 0.05 + i * 1.3) + 1) * 0.2),
            boxShadow: '0 0 8px rgba(255,255,255,0.45)',
          }} />
        ))}
      </AbsoluteFill>

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: isVertical ? 32 : 24, padding: isVertical ? '0 50px' : '0 120px',
      }}>
        {/* Logo */}
        <div style={{opacity: logoOp, transform: `scale(${logoScale})`, marginBottom: 4}}>
          <Img
            src={staticFile('Carrocel-01/logo.png')}
            style={{height: 80, objectFit: 'contain', filter: 'brightness(10) drop-shadow(0 0 24px rgba(255,255,255,0.5))'}}
          />
        </div>

        {/* Headline */}
        <div style={{
          opacity: h1Op, transform: `translateY(${h1Y}px)`,
          fontSize: isVertical ? 82 : 108, fontWeight: 900, color: '#FFFFFF',
          textAlign: 'center', letterSpacing: '-4px', lineHeight: 1.0,
          textShadow: '0 4px 32px rgba(0,0,0,0.3)',
        }}>
          Avalie antes<br />de comprar.
        </div>

        {/* Subtitle */}
        <div style={{
          opacity: subOp, transform: `translateY(${subY}px)`,
          fontSize: isVertical ? 32 : 40, fontWeight: 300, color: 'rgba(255,255,255,0.85)',
          textAlign: 'center', lineHeight: 1.55, maxWidth: isVertical ? '100%' : 900,
        }}>
          Compare fabricantes com dados reais de quem já comprou.
          <br />
          <span style={{fontWeight: 600}}>Trust Score™</span> baseado em milhares de avaliações verificadas.
        </div>

        {/* CTA Button */}
        <div style={{
          opacity: btnOp, transform: `scale(${btnPulse})`,
          background: '#FFFFFF', borderRadius: 60, padding: isVertical ? '20px 60px' : '28px 88px',
          fontSize: isVertical ? 40 : 52, fontWeight: 800, color: C_GREEN_CTG,
          boxShadow: `0 0 ${btnGlow}px rgba(255,255,255,0.5), 0 12px 56px rgba(0,0,0,0.35)`,
          letterSpacing: '-0.5px',
        }}>
          avaliasolar.com.br
        </div>

        {/* Hashtags */}
        <div style={{opacity: tagsOp, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: isVertical ? 16 : 24, marginTop: 8}}>
          {tags.map((t) => (
            <span key={t} style={{fontSize: isVertical ? 18 : 22, color: 'rgba(255,255,255,0.5)', fontWeight: 500}}>{t}</span>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── ROOT COMPOSITION — 1800 frames = 60s ────────────────────────────────────
export const PromoVideo60s: React.FC = () => {
  const {width, height} = useVideoConfig();
  const isVertical = height > width;

  return (
    <AbsoluteFill style={{background: '#000000'}}>
      {/* Background Music */}
      <Audio 
        src={staticFile('Carrocel-01/audio-master-video-03.mp3')} 
      />

      {/* S1: 0–255    Ranking Cover     */}
      <Sequence from={0}    durationInFrames={255}><Scene1Cover isVertical={isVertical} /></Sequence>
      {/* S2: 240–495  O Risco Real      */}
      <Sequence from={240}  durationInFrames={255}><Scene2Risco isVertical={isVertical} /></Sequence>
      {/* S3: 480–705  Trust Score       */}
      <Sequence from={480}  durationInFrames={225}><Scene3TrustScore isVertical={isVertical} /></Sequence>
      {/* S4: 690–945  Líderes #1–4      */}
      <Sequence from={690}  durationInFrames={255}><Scene4Lideres isVertical={isVertical} /></Sequence>
      {/* S5: 930–1155 Forte Atuação BR  */}
      <Sequence from={930}  durationInFrames={225}><Scene5Brasil isVertical={isVertical} /></Sequence>
      {/* S6: 1140–1395 Platform Take    */}
      <Sequence from={1140} durationInFrames={255}><Scene6Platform isVertical={isVertical} /></Sequence>
      {/* S7: 1380–1605 5 Perguntas      */}
      <Sequence from={1380} durationInFrames={225}><Scene7Perguntas isVertical={isVertical} /></Sequence>
      {/* S8: 1590–1800 CTA Final        */}
      <Sequence from={1590} durationInFrames={210}><Scene8CTA isVertical={isVertical} /></Sequence>
    </AbsoluteFill>
  );
};
