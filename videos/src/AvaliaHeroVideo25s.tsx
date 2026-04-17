/**
 * Avalia Solar — 25s Product Hero Video
 * 1920×1080 · 30fps · 750 frames
 *
 * Técnica: GIF/screenshot da plataforma como "footage"
 * Câmera virtual com zoom/pan via transform: translate scale
 *
 * Formula (transformOrigin: center):
 *   tx = (0.5 - fx) * W  →  ponto fx fica no centro da tela
 *   ty = (0.5 - fy) * H
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  staticFile,
  Img,
  useVideoConfig,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont();

// ─── CAMERA ──────────────────────────────────────────────────────────────────
// Focus points medidos no GIF (frações 0-1):
//  hero      (0.50, 0.34) — headline principal
//  subtitle  (0.50, 0.54) — "Compare empresas verificadas…"
//  search    (0.50, 0.70) — barra de busca
//  button    (0.71, 0.71) — botão "Buscar Empresas"
//  center    (0.50, 0.50) — plano geral
//  leftPan   (0.32, 0.50) — navbar esquerda
//  rightPan  (0.68, 0.50) — nav direita

const useCamera = () => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const isVertical = H > W;

  // Em vertical, escalamos um pouco mais para garantir que os detalhes da plataforma fiquem visíveis
  const scaleMult = isVertical ? 2.2 : 1.0;

  const scale = interpolate(
    frame,
    [  0,  60,  90, 180, 270, 330, 390, 450, 480, 540, 570, 660, 720, 750],
    [1.12, 1.0, 1.0, 1.22, 1.40, 1.22, 1.05, 1.0, 1.08, 1.08, 1.22, 1.58, 1.20, 1.0].map(s => s * scaleMult),
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  const fx = interpolate(
    frame,
    [  0,  90, 180, 270, 390, 480, 540, 570, 660, 720, 750],
    [0.50, 0.50, 0.50, 0.50, 0.50, 0.32, 0.68, 0.71, 0.71, 0.58, 0.50],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  const fy = interpolate(
    frame,
    [  0,  60,  90, 150, 180, 270, 390, 480, 540, 570, 660, 720, 750],
    [0.34, 0.50, 0.50, 0.54, 0.54, 0.70, 0.50, 0.50, 0.50, 0.71, 0.71, 0.55, 0.50],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // Blur momentâneo em S4 (refocus "organização")
  const blur = interpolate(
    frame,
    [270, 292, 345, 390],
    [  0,   7,   7,   0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // No modo vertical, o "width" da imagem original (screenshot/gif) não é necessariamente W.
  // Como estamos usando objectFit cover, a imagem original (1920x1080) é escalada para cobrir WxH.
  // Se H > W (vertical), o fator de escala da imagem é H / 1080.
  // A largura visível da imagem original em pixels de composição será 1920 * (H/1080).
  const imgScale = isVertical ? (H / 1080) : (W / 1920);
  const originalWidthInComp = 1920 * imgScale;
  const originalHeightInComp = 1080 * imgScale;

  return {
    scale,
    tx: (0.5 - fx) * originalWidthInComp,
    ty: (0.5 - fy) * originalHeightInComp,
    blur,
    isVertical,
  };
};

// ─── CAPTIONS ────────────────────────────────────────────────────────────────
const CAPTIONS = [
  {s:   6, e:  84, text: 'Hoje, escolher uma empresa de energia solar ainda é um risco.'},
  {s:  96, e: 174, text: 'Você não sabe quem realmente entrega qualidade, prazo e suporte.'},
  {s: 186, e: 264, text: 'E escolher errado pode custar caro.'},
  {s: 278, e: 384, text: 'Foi exatamente por isso que criamos o Avalia Solar.'},
  {s: 396, e: 534, text: 'Empresas verificadas, avaliações reais e decisões mais seguras.'},
  {s: 548, e: 652, text: 'Aqui, confiança não é promessa. É dado real.'},
  {s: 666, e: 744, text: 'Avalia Solar. Escolha com confiança.'},
];

const CaptionLayer: React.FC<{isVertical: boolean}> = ({isVertical}) => {
  const frame = useCurrentFrame();
  const active = CAPTIONS.find((c) => frame >= c.s && frame <= c.e);
  if (!active) return null;

  const op = interpolate(
    frame,
    [active.s, active.s + 14, active.e - 14, active.e],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  const isLast = active === CAPTIONS[CAPTIONS.length - 1];

  return (
    <div style={{
      position: 'absolute', 
      bottom: isVertical ? 220 : 52, 
      left: '50%',
      transform: 'translateX(-50%)',
      opacity: op, 
      width: isVertical ? '85%' : 1380, 
      textAlign: 'center',
      background: 'rgba(0,0,0,0.70)',
      backdropFilter: 'blur(18px)',
      borderRadius: isVertical ? 40 : 60, 
      padding: isVertical ? '32px 40px' : (isLast ? '22px 64px' : '16px 52px'),
      border: '1px solid rgba(255,255,255,0.1)',
      fontFamily, 
      whiteSpace: isVertical ? 'normal' : 'nowrap',
    }}>
      {isLast ? (
        <span style={{
          fontSize: isVertical ? 48 : 46, 
          fontWeight: 900, 
          color: '#FFFFFF', 
          letterSpacing: '-0.5px'
        }}>
          Avalia Solar.{' '}
          <span style={{color: '#22C55E'}}>Escolha com confiança.</span>
        </span>
      ) : (
        <span style={{
          fontSize: isVertical ? 42 : 34, 
          fontWeight: 400, 
          color: '#FFFFFF', 
          lineHeight: 1.4
        }}>
          {active.text}
        </span>
      )}
    </div>
  );
};

// ─── FAKE CURSOR ─────────────────────────────────────────────────────────────
const FakeCursor: React.FC = () => {
  const frame = useCurrentFrame();

  const op = interpolate(frame, [162, 180, 610, 635], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (op === 0) return null;

  // X: entra pelo topo → campo busca → botão → centro (onde botão chega no zoom S6)
  const cx = interpolate(
    frame,
    [162, 210, 265, 390, 500, 550, 580, 630],
    [920, 800, 770, 800, 1050, 1100, 960, 960],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  const cy = interpolate(
    frame,
    [162, 210, 265, 390, 500, 550, 580, 630],
    [240, 545, 545, 545, 545, 540, 540, 540],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // Click em frame ~565 (botão aparece no centro durante S6)
  const clickSp = spring({frame: Math.max(0, frame - 562), fps: 30, config: {damping: 5, stiffness: 420}});
  const isClick = frame >= 562 && frame <= 585;
  const cursorScale = isClick ? interpolate(clickSp, [0, 1], [1, 0.72]) : 1;

  // Ripple
  const rippleOp  = interpolate(frame, [566, 568, 600], [0, 0.9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rippleScl = interpolate(frame, [566, 600], [0.4, 2.8], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});

  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {/* Click ripple */}
      <div style={{
        position: 'absolute', left: cx, top: cy,
        transform: 'translate(-50%, -50%)', opacity: rippleOp,
      }}>
        <div style={{
          width: 54, height: 54, borderRadius: '50%',
          border: '2.5px solid rgba(59,130,246,0.85)',
          transform: `scale(${rippleScl})`,
        }} />
      </div>

      {/* Arrow cursor */}
      <div style={{
        position: 'absolute', left: cx, top: cy,
        transform: `scale(${cursorScale})`,
        opacity: op,
      }}>
        <svg width="30" height="34" viewBox="0 0 30 34" fill="none">
          <path
            d="M3 3L3 26L10 19L14 30L19 28L15 17L23 17L3 3Z"
            fill="white"
            stroke="#1a365d"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

// ─── BUTTON GLOW — S6 (botão "Buscar Empresas" em tela cheia) ─────────────────
const ButtonGlow: React.FC = () => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [550, 568, 648, 668], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (op === 0) return null;

  const pulse = interpolate(Math.sin(frame * 0.15), [-1, 1], [0.92, 1.08]);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      opacity: op, pointerEvents: 'none',
    }}>
      {/* Outer pulse ring */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: `translate(-50%, -50%) scale(${pulse})`,
        width: 460, height: 112,
        borderRadius: 56,
        border: '2px solid rgba(59,130,246,0.55)',
        boxShadow: '0 0 48px rgba(59,130,246,0.35), 0 0 100px rgba(59,130,246,0.18)',
      }} />
      {/* Inner glow fill */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 390, height: 92, borderRadius: 46,
        background: 'rgba(59,130,246,0.08)',
        filter: 'blur(6px)',
      }} />
    </div>
  );
};

// ─── CTA OVERLAY — S7 (texto final sobre screenshot) ─────────────────────────
const CTAOverlay: React.FC<{isVertical: boolean}> = ({isVertical}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [668, 690, 738, 750], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (op === 0) return null;

  const logoScale = spring({frame: Math.max(0, frame - 670), fps: 30, config: {damping: 12, stiffness: 120}});

  return (
    <AbsoluteFill style={{
      opacity: op,
      background: 'rgba(6,95,70,0.72)',
      backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: isVertical ? 40 : 18, fontFamily,
      padding: isVertical ? '0 60px' : '0',
    }}>
      <div style={{transform: `scale(${logoScale})`}}>
        <Img
          src={staticFile('Carrocel-01/logo.png')}
          style={{
            height: isVertical ? 120 : 72, 
            objectFit: 'contain', 
            filter: 'brightness(10) drop-shadow(0 0 20px rgba(255,255,255,0.5))'
          }}
        />
      </div>
      <div style={{
        fontSize: isVertical ? 86 : 76, 
        fontWeight: 900, 
        color: '#FFFFFF', 
        letterSpacing: '-2px', 
        textAlign: 'center', 
        lineHeight: 1.1
      }}>
        Avalie antes de comprar.
      </div>
      <div style={{
        fontSize: isVertical ? 42 : 32, 
        fontWeight: 300, 
        color: 'rgba(255,255,255,0.8)', 
        textAlign: 'center'
      }}>
        Dados reais. Decisão inteligente.
      </div>
    </AbsoluteFill>
  );
};

// ─── VIGNETTE ────────────────────────────────────────────────────────────────
const Vignette: React.FC = () => (
  <AbsoluteFill style={{
    background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.52) 100%)',
    pointerEvents: 'none',
  }} />
);

// ─── SCAN LINE — S5 pan ───────────────────────────────────────────────────────
const ScanLine: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [390, 540], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const op = interpolate(frame, [390, 420, 515, 540], [0, 0.28, 0.28, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (op === 0) return null;
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0,
      top: `${progress * 100}%`,
      height: 2, opacity: op, pointerEvents: 'none',
      background: 'linear-gradient(90deg, transparent 5%, rgba(59,130,246,0.5) 30%, rgba(99,179,237,0.7) 50%, rgba(59,130,246,0.5) 70%, transparent 95%)',
      boxShadow: '0 0 14px rgba(59,130,246,0.45)',
    }} />
  );
};

// ─── PARTICLES — S4/S5 ────────────────────────────────────────────────────────
const ptData = [
  {l:10,t:22,s:0.042}, {l:86,t:18,s:0.036}, {l:24,t:74,s:0.051},
  {l:74,t:80,s:0.031}, {l:4, t:52,s:0.047}, {l:94,t:44,s:0.039},
  {l:50,t:10,s:0.044}, {l:50,t:90,s:0.033},
];
const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [270, 320, 490, 545], [0, 0.55, 0.55, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (op === 0) return null;
  return (
    <AbsoluteFill style={{overflow: 'hidden', opacity: op, pointerEvents: 'none'}}>
      {ptData.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${p.l}%`, top: `${p.t}%`,
          width: 4, height: 4, borderRadius: '50%',
          background: 'rgba(59,130,246,0.75)',
          opacity: (Math.sin(frame * p.s + i * 1.8) + 1) * 0.45,
          boxShadow: '0 0 10px rgba(59,130,246,0.65)',
        }} />
      ))}
    </AbsoluteFill>
  );
};

// ─── SCENE BADGE (top-left) ───────────────────────────────────────────────────
const BADGES = [
  {s:  6, e:  84, label: 'PROBLEMA'},
  {s: 96, e: 174, label: 'MERCADO'},
  {s:186, e: 264, label: 'RISCO'},
  {s:278, e: 384, label: 'SOLUÇÃO'},
  {s:396, e: 534, label: 'PLATAFORMA'},
  {s:548, e: 652, label: 'DIFERENCIAL'},
  {s:666, e: 744, label: 'AVALIA SOLAR'},
];
const SceneBadge: React.FC<{isVertical: boolean}> = ({isVertical}) => {
  const frame = useCurrentFrame();
  const active = BADGES.find((b) => frame >= b.s && frame <= b.e);
  if (!active) return null;
  const op = interpolate(frame, [active.s, active.s + 12, active.e - 12, active.e], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{
      position: 'absolute', 
      top: isVertical ? 80 : 34, 
      left: isVertical ? '50%' : 34, 
      transform: isVertical ? 'translateX(-50%)' : 'none',
      opacity: op,
      background: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.14)',
      borderRadius: 12, padding: isVertical ? '12px 32px' : '8px 20px',
      fontFamily, 
      fontSize: isVertical ? 24 : 16, 
      fontWeight: 700,
      color: 'rgba(255,255,255,0.6)', 
      letterSpacing: isVertical ? 5 : 3.5,
      whiteSpace: 'nowrap',
    }}>
      {active.label}
    </div>
  );
};

// ─── WATERMARK ────────────────────────────────────────────────────────────────
const Watermark: React.FC = () => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 28], [0, 0.45], {extrapolateRight: 'clamp'});
  return (
    <div style={{
      position: 'absolute', bottom: 22, right: 34,
      opacity: op, fontFamily, fontSize: 17, fontWeight: 600,
      color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5,
    }}>
      avaliasolar.com.br
    </div>
  );
};

// ─── MAIN COMPOSITION (750 frames = 25s) ─────────────────────────────────────
export const AvaliaHeroVideo25s: React.FC = () => {
  const {scale, tx, ty, blur, isVertical} = useCamera();

  return (
    <AbsoluteFill style={{background: '#d8eefa', overflow: 'hidden'}}>
      {/* ① Screenshot layer — virtual camera */}
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
        <div style={{
          position: 'absolute', inset: 0,
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          transformOrigin: '50% 50%',
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          willChange: 'transform',
        }}>
          <Img
            src={staticFile('Carrocel-01/avalia-solar-gif.gif')}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        </div>
      </div>

      {/* ② Effects stack */}
      <Vignette />
      <ScanLine />
      <Particles />
      <ButtonGlow />

      {/* ③ Interaction */}
      <FakeCursor />

      {/* ④ S7 CTA overlay */}
      <CTAOverlay isVertical={isVertical} />

      {/* ⑤ Text layers */}
      <SceneBadge isVertical={isVertical} />
      <CaptionLayer isVertical={isVertical} />
      <Watermark />
    </AbsoluteFill>
  );
};
