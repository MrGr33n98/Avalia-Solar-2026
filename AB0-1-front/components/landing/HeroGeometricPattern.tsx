/**
 * HeroGeometricPattern — SVG inline decorativo
 *
 * Padrão geométrico leve inspirado em Swiss Style / SaaS marketplace.
 * Elementos: linhas diagonais, losangos, grid de pontos, traços curtos.
 * Totalmente puramente decorativo: aria-hidden, pointer-events-none.
 */
export function HeroGeometricPattern() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* ── Linhas diagonais finas ── */}
      <g stroke="#2563EB" strokeWidth="0.6" opacity="0.07">
        <line x1="0" y1="120" x2="320" y2="0" />
        <line x1="0" y1="280" x2="480" y2="0" />
        <line x1="60" y1="600" x2="660" y2="0" />
        <line x1="200" y1="600" x2="800" y2="0" />
        <line x1="900" y1="600" x2="1200" y2="260" />
        <line x1="1050" y1="600" x2="1200" y2="500" />
      </g>

      {/* ── Losangos / quadrados rotacionados ── */}
      <g fill="none" stroke="#FFB800" strokeWidth="1" opacity="0.13">
        {/* grande — canto superior direito */}
        <rect x="1020" y="-40" width="100" height="100" rx="0" transform="rotate(45 1070 10)" />
        {/* médio — área central direita */}
        <rect x="860" y="180" width="60" height="60" rx="0" transform="rotate(45 890 210)" />
        {/* pequeno — canto inferior direito */}
        <rect x="1100" y="420" width="44" height="44" rx="0" transform="rotate(45 1122 442)" />
        {/* pequeno — área esquerda baixa */}
        <rect x="60" y="380" width="36" height="36" rx="0" transform="rotate(45 78 398)" />
      </g>

      {/* ── Quadrado azul outline — detalhe suave ── */}
      <g fill="none" stroke="#2563EB" strokeWidth="0.8" opacity="0.08">
        <rect x="700" y="60" width="80" height="80" rx="0" transform="rotate(15 740 100)" />
        <rect x="140" y="100" width="48" height="48" rx="0" transform="rotate(-10 164 124)" />
      </g>

      {/* ── Grid de pontos — área esquerda ── */}
      <g fill="#2563EB" opacity="0.09">
        {[0, 1, 2, 3, 4].map((col) =>
          [0, 1, 2, 3].map((row) => (
            <circle
              key={`dot-${col}-${row}`}
              cx={90 + col * 28}
              cy={300 + row * 28}
              r="1.8"
            />
          ))
        )}
      </g>

      {/* ── Grid de pontos amarelo — área direita ── */}
      <g fill="#FFB800" opacity="0.10">
        {[0, 1, 2, 3].map((col) =>
          [0, 1, 2].map((row) => (
            <circle
              key={`dot-y-${col}-${row}`}
              cx={980 + col * 22}
              cy={360 + row * 22}
              r="1.5"
            />
          ))
        )}
      </g>

      {/* ── Traços curtos horizontais — detalhe técnico ── */}
      <g stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" opacity="0.10">
        <line x1="60" y1="180" x2="96" y2="180" />
        <line x1="72" y1="195" x2="108" y2="195" />
        <line x1="60" y1="210" x2="84" y2="210" />
        <line x1="1100" y1="160" x2="1140" y2="160" />
        <line x1="1110" y1="175" x2="1150" y2="175" />
      </g>

      {/* ── Cruz / crosshair — detalhe minimalista ── */}
      <g stroke="#2563EB" strokeWidth="0.7" opacity="0.09">
        <line x1="640" y1="28" x2="640" y2="52" />
        <line x1="628" y1="40" x2="652" y2="40" />
        <line x1="240" y1="500" x2="240" y2="524" />
        <line x1="228" y1="512" x2="252" y2="512" />
      </g>
    </svg>
  );
}
