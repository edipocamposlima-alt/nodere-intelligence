"use client";

interface LogoProps {
  variant?: "full" | "icon";
  height?: number;
  className?: string;
}

export function Logo({ variant = "full", height = 32, className = "" }: LogoProps) {
  if (variant === "icon") {
    return (
      <div
        className={className}
        style={{
          width: height,
          height,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <svg
          width={height}
          height={height}
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="NODERE"
        >
          <defs>
            <linearGradient id="ng-icon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2A9D6A" />
              <stop offset="100%" stopColor="#03624C" />
            </linearGradient>
          </defs>
          <rect width="44" height="44" rx="11" fill="url(#ng-icon)" />
          <rect x="1" y="1" width="42" height="42" rx="10" fill="none" stroke="#00DF82" strokeWidth="1.5" strokeDasharray="5 70" opacity="0.7" />
          <circle cx="37" cy="1" r="3" fill="#00DF82" opacity="0.85" />
          <circle cx="37" cy="43" r="3" fill="#00DF82" opacity="0.85" />
          <text x="22" y="33" textAnchor="middle" fontFamily="Inter,Arial,sans-serif" fontSize="26" fontWeight="900" fill="white">N</text>
        </svg>
      </div>
    );
  }

  const iconSize = Math.round(height * 1.0);
  const fontSize = Math.round(height * 0.62);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: Math.round(height * 0.22),
        flexShrink: 0,
        height
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="ng-full" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2A9D6A" />
            <stop offset="100%" stopColor="#03624C" />
          </linearGradient>
        </defs>
        <rect width="44" height="44" rx="11" fill="url(#ng-full)" />
        <rect x="1" y="1" width="42" height="42" rx="10" fill="none" stroke="#00DF82" strokeWidth="1.5" strokeDasharray="5 70" opacity="0.7" />
        <circle cx="37" cy="1" r="3" fill="#00DF82" opacity="0.85" />
        <circle cx="37" cy="43" r="3" fill="#00DF82" opacity="0.85" />
        <text x="22" y="33" textAnchor="middle" fontFamily="Inter,Arial,sans-serif" fontSize="26" fontWeight="900" fill="white">N</text>
      </svg>
      <span
        aria-label="NODERE"
        style={{
          fontSize,
          fontWeight: 800,
          letterSpacing: "-0.4px",
          lineHeight: 1,
          color: "var(--text-primary)",
          fontFamily: "Inter, system-ui, sans-serif",
          userSelect: "none"
        }}
      >
        NODERE
      </span>
    </div>
  );
}

export default Logo;
