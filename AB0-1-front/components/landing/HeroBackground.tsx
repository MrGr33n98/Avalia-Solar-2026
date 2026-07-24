/**
 * HeroBackground — fundo decorativo do hero principal
 *
 * Camadas (bottom → top):
 * 1. Gradiente base: branco → azul suave
 * 2. Halo solar: radial-gradient amarelo no canto superior direito
 * 3. Sol geométrico: círculos concêntricos CSS (3 camadas)
 * 4. Padrão SVG: linhas, losangos, pontos (HeroGeometricPattern)
 *
 * Totalmente decorativo:
 * - aria-hidden="true"
 * - pointer-events-none
 * - z-0 (abaixo do conteúdo em z-10)
 */
import { HeroGeometricPattern } from './HeroGeometricPattern';

export function HeroBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {/* ── 1. Gradiente base ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, #ffffff 0%, #f8fbff 55%, #eef5ff 100%)',
        }}
      />

      {/* ── 2. Halo solar — brilho suave ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 88% 10%, rgba(255,184,0,0.18) 0%, rgba(255,184,0,0.07) 22%, transparent 40%)',
        }}
      />

      {/* ── 3. Sol geométrico — canto superior direito ── */}
      {/* Camada 3 — anel externo, mais translúcido */}
      <div
        className="absolute rounded-full"
        style={{
          width: 'clamp(200px, 30vw, 360px)',
          height: 'clamp(200px, 30vw, 360px)',
          top: 'clamp(-120px, -14vw, -160px)',
          right: 'clamp(-120px, -12vw, -150px)',
          background:
            'radial-gradient(circle, rgba(255,184,0,0.10) 0%, rgba(255,184,0,0.04) 60%, transparent 80%)',
        }}
      />
      {/* Camada 2 — anel médio */}
      <div
        className="absolute rounded-full"
        style={{
          width: 'clamp(150px, 22vw, 260px)',
          height: 'clamp(150px, 22vw, 260px)',
          top: 'clamp(-90px, -10vw, -120px)',
          right: 'clamp(-90px, -9vw, -110px)',
          background:
            'radial-gradient(circle, rgba(255,184,0,0.20) 0%, rgba(255,184,0,0.10) 50%, transparent 75%)',
        }}
      />
      {/* Camada 1 — núcleo do sol */}
      <div
        className="absolute rounded-full"
        style={{
          width: 'clamp(90px, 14vw, 170px)',
          height: 'clamp(90px, 14vw, 170px)',
          top: 'clamp(-50px, -6vw, -70px)',
          right: 'clamp(-50px, -5vw, -65px)',
          background:
            'radial-gradient(circle, rgba(255,184,0,0.55) 0%, rgba(255,184,0,0.30) 45%, rgba(255,184,0,0.08) 70%, transparent 90%)',
        }}
      />

      {/* ── 4. Linha diagonal de acento — Swiss style ── */}
      <div
        className="absolute"
        style={{
          top: '0',
          right: '0',
          width: 'clamp(180px, 28vw, 340px)',
          height: '2px',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.12) 50%, rgba(255,184,0,0.20) 100%)',
          transform: 'rotate(-28deg)',
          transformOrigin: 'top right',
          marginTop: 'clamp(80px, 10vw, 120px)',
        }}
      />

      {/* ── 5. Padrão SVG geométrico ── */}
      <HeroGeometricPattern />
    </div>
  );
}
