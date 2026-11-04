'use client';

export const ALERT_PARTICLE_OPTIONS = [
  { value: 'none', label: 'Tanpa partikel', icon: '—' },
  { value: 'sparkle', label: 'Kilau', icon: '✦' },
  { value: 'hearts', label: 'Hati', icon: '♥' },
  { value: 'stars', label: 'Bintang', icon: '★' },
  { value: 'confetti', label: 'Confetti', icon: '▰' },
  { value: 'bubbles', label: 'Bubble', icon: '●' },
];

const SYMBOLS = {
  sparkle: ['✦', '✧', '✨'],
  hearts: ['♥', '♡'],
  stars: ['★', '☆'],
  bubbles: ['●', '○'],
};

const CONFETTI_COLORS = ['#60A5FA', '#FBBF24', '#F472B6', '#34D399', '#A78BFA'];

export default function AlertParticles({ type = 'none', color = '#60A5FA' }) {
  if (type === 'none') return null;

  const isConfetti = type === 'confetti';
  const symbols = SYMBOLS[type] || SYMBOLS.sparkle;

  return (
    <div className="pointer-events-none absolute inset-0 z-[12] overflow-hidden" aria-hidden="true">
      {Array.from({ length: 18 }, (_, index) => {
        const particleColor = isConfetti ? CONFETTI_COLORS[index % CONFETTI_COLORS.length] : color;

        return (
          <span
            key={index}
            className={`jd-alert-particle absolute ${isConfetti ? 'rounded-[2px]' : 'font-black leading-none'}`}
            style={{
              '--particle-x': `${(index * 37 + 7) % 96}%`,
              '--particle-delay': `${-(index % 9) * 0.34}s`,
              '--particle-duration': `${2.8 + (index % 5) * 0.36}s`,
              '--particle-drift': `${((index % 5) - 2) * 18}px`,
              left: `var(--particle-x)`,
              color: particleColor,
              backgroundColor: isConfetti ? particleColor : 'transparent',
              fontSize: `${12 + (index % 4) * 4}px`,
              height: isConfetti ? `${6 + (index % 3) * 2}px` : undefined,
              width: isConfetti ? `${4 + (index % 4) * 2}px` : undefined,
            }}
          >
            {isConfetti ? '' : symbols[index % symbols.length]}
          </span>
        );
      })}

      <style>{`
        @keyframes jd-alert-particle-float {
          0% { top: 108%; opacity: 0; transform: translateX(0) rotate(0deg) scale(.75); }
          14% { opacity: .9; }
          82% { opacity: .85; }
          100% { top: -18%; opacity: 0; transform: translateX(var(--particle-drift)) rotate(320deg) scale(1.12); }
        }
        .jd-alert-particle {
          top: 108%;
          animation: jd-alert-particle-float var(--particle-duration) linear var(--particle-delay) infinite;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, .2));
          will-change: top, opacity, transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .jd-alert-particle { animation: none; display: none; }
        }
      `}</style>
    </div>
  );
}
