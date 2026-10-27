import React from 'react';

export function IGuestBrandLogo({
  primaryColor = '#9E1B32',
  secondaryColor = '#D4AF37'
}: {
  primaryColor?: string;
  secondaryColor?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md border border-white/80 relative overflow-hidden shrink-0"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
        }}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-7 h-7"
          aria-hidden="true"
        >
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="white"
            strokeOpacity="0.45"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          {/* Interlocking Royal Wedding Lotus & Rings */}
          <path
            d="M20 7C23 13 26 16 20 22C14 16 17 13 20 7Z"
            fill="white"
            fillOpacity="0.92"
          />
          <path
            d="M12 15C16 16 18 18 19 22C15 21 13 19 12 15Z"
            fill="white"
            fillOpacity="0.75"
          />
          <path
            d="M28 15C24 16 22 18 21 22C25 21 27 19 28 15Z"
            fill="white"
            fillOpacity="0.75"
          />
          <circle
            cx="16.5"
            cy="26.5"
            r="4.2"
            stroke="white"
            strokeWidth="1.6"
          />
          <circle
            cx="23.5"
            cy="26.5"
            r="4.2"
            stroke="white"
            strokeWidth="1.6"
          />
        </svg>
      </div>
      <span className="text-xl sm:text-2xl font-serif-display font-bold tracking-tight text-[var(--theme-text)] whitespace-nowrap">
        I-Guest
      </span>
    </div>
  );
}

export function MandalaCrest({
  className = 'w-16 h-16',
  primaryColor = 'var(--theme-primary)',
  secondaryColor = 'var(--theme-secondary)'
}: {
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="60"
        cy="60"
        r="54"
        stroke={primaryColor}
        strokeWidth="1.3"
        strokeDasharray="3 3"
        strokeOpacity="0.5"
      />
      <circle
        cx="60"
        cy="60"
        r="44"
        stroke={secondaryColor}
        strokeWidth="1.4"
        strokeOpacity="0.75"
      />
      {/* 8 Lotus Petals */}
      <path
        d="M60 10C66 25 70 36 60 46C50 36 54 25 60 10Z"
        fill={primaryColor}
        fillOpacity="0.16"
        stroke={primaryColor}
        strokeWidth="1.5"
      />
      <path
        d="M60 110C66 95 70 84 60 74C50 84 54 95 60 110Z"
        fill={primaryColor}
        fillOpacity="0.16"
        stroke={primaryColor}
        strokeWidth="1.5"
      />
      <path
        d="M10 60C25 54 36 50 46 60C36 70 25 66 10 60Z"
        fill={primaryColor}
        fillOpacity="0.16"
        stroke={primaryColor}
        strokeWidth="1.5"
      />
      <path
        d="M110 60C95 54 84 50 74 60C84 70 95 66 110 60Z"
        fill={primaryColor}
        fillOpacity="0.16"
        stroke={primaryColor}
        strokeWidth="1.5"
      />
      <path
        d="M25 25C38 32 46 38 48 48C38 46 32 38 25 25Z"
        fill={secondaryColor}
        fillOpacity="0.28"
        stroke={primaryColor}
        strokeWidth="1.3"
      />
      <path
        d="M95 25C82 32 74 38 72 48C82 46 88 38 95 25Z"
        fill={secondaryColor}
        fillOpacity="0.28"
        stroke={primaryColor}
        strokeWidth="1.3"
      />
      <path
        d="M25 95C38 88 46 82 48 72C38 74 32 82 25 95Z"
        fill={secondaryColor}
        fillOpacity="0.28"
        stroke={primaryColor}
        strokeWidth="1.3"
      />
      <path
        d="M95 95C82 88 74 82 72 72C82 74 88 82 95 95Z"
        fill={secondaryColor}
        fillOpacity="0.28"
        stroke={primaryColor}
        strokeWidth="1.3"
      />
      <circle
        cx="60"
        cy="60"
        r="15"
        fill={secondaryColor}
        fillOpacity="0.18"
        stroke={primaryColor}
        strokeWidth="1.5"
      />
      <path
        d="M60 53.5C57.5 50.5 52.5 51.5 52.5 56C52.5 60 60 64.5 60 66.5C60 64.5 67.5 60 67.5 56C67.5 51.5 62.5 50.5 60 53.5Z"
        fill={primaryColor}
      />
    </svg>
  );
}

export function FloralDivider({ className = 'w-48 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 14H92"
        stroke="var(--theme-primary)"
        strokeOpacity="0.45"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M148 14H230"
        stroke="var(--theme-primary)"
        strokeOpacity="0.45"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M120 3L127 14L120 25L113 14L120 3Z"
        fill="var(--theme-secondary)"
        fillOpacity="0.3"
        stroke="var(--theme-primary)"
        strokeWidth="1.4"
      />
      <circle cx="103" cy="14" r="2.8" fill="var(--theme-secondary)" />
      <circle cx="137" cy="14" r="2.8" fill="var(--theme-secondary)" />
    </svg>
  );
}

export function FloatingPetalsBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Ambient Royal Wedding Glow Orbs */}
      <div
        className="absolute -top-28 -left-24 w-[28rem] h-[28rem] rounded-full blur-3xl animate-soft-glow"
        style={{ background: 'radial-gradient(circle, var(--theme-secondary) 0%, transparent 70%)', opacity: 0.22 }}
      />
      <div
        className="absolute top-1/4 -right-28 w-[30rem] h-[30rem] rounded-full blur-3xl animate-soft-glow"
        style={{ background: 'radial-gradient(circle, var(--theme-primary) 0%, transparent 70%)', opacity: 0.15 }}
      />
      <div
        className="absolute -bottom-32 left-1/4 w-[26rem] h-[26rem] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--theme-secondary) 0%, transparent 70%)', opacity: 0.18 }}
      />

      {/* Slowly Rotating Architectural Heritage Mandala Watermark */}
      <svg
        className="absolute -right-36 -bottom-36 w-[34rem] h-[34rem] opacity-[0.055] animate-mandala-spin"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="100" cy="100" r="92" stroke="var(--theme-primary)" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="100" cy="100" r="74" stroke="var(--theme-primary)" strokeWidth="1.2" />
        <circle cx="100" cy="100" r="52" stroke="var(--theme-secondary)" strokeWidth="1.5" />
        <path d="M100 8 C115 45, 130 65, 100 92 C70 65, 85 45, 100 8 Z" stroke="var(--theme-primary)" strokeWidth="1.2" />
        <path d="M100 192 C115 155, 130 135, 100 108 C70 135, 85 155, 100 192 Z" stroke="var(--theme-primary)" strokeWidth="1.2" />
        <path d="M8 100 C45 85, 65 70, 92 100 C65 130, 45 115, 8 100 Z" stroke="var(--theme-primary)" strokeWidth="1.2" />
        <path d="M192 100 C155 85, 135 70, 108 100 C135 130, 155 115, 192 100 Z" stroke="var(--theme-primary)" strokeWidth="1.2" />
      </svg>

      {/* Floating Petals & Golden Sparkles */}
      <svg
        className="absolute top-20 left-[7%] w-6 h-6 animate-petal-slow"
        style={{ color: 'var(--theme-primary)', opacity: 0.28 }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2C15 7 19 10 12 22C5 10 9 7 12 2Z" />
      </svg>
      <svg
        className="absolute top-32 right-[11%] w-5 h-5 animate-petal-delayed"
        style={{ color: 'var(--theme-secondary)', opacity: 0.45 }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
      </svg>
      <svg
        className="absolute top-2/3 left-[9%] w-5 h-5 animate-petal-delayed"
        style={{ color: 'var(--theme-primary)', opacity: 0.24 }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
      </svg>
      <svg
        className="absolute bottom-24 right-[15%] w-7 h-7 animate-petal-slow"
        style={{ color: 'var(--theme-secondary)', opacity: 0.35 }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2C15 7 19 10 12 22C5 10 9 7 12 2Z" />
      </svg>
    </div>
  );
}
