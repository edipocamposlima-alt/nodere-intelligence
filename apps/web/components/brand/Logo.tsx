"use client";

interface LogoProps {
  variant?: "full" | "icon";
  height?: number;
  className?: string;
}

export function Logo({ variant = "full", height = 32, className = "" }: LogoProps) {
  const width = variant === "icon" ? height : Math.round(height * 2.45);

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
        <svg width={height} height={height} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="NODERE">
          <defs>
            <linearGradient id="nodere-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2A9D6A" />
              <stop offset="100%" stopColor="#03624C" />
            </linearGradient>
          </defs>
          <rect x="2" y="3" width="38" height="38" rx="10" fill="url(#nodere-icon-gradient)" />
          <rect x="3" y="4" width="36" height="36" rx="9" fill="none" stroke="#00DF82" strokeWidth="1.2" strokeDasharray="4 60" opacity="0.7" />
          <circle cx="34" cy="4" r="2.5" fill="#00DF82" opacity="0.85" />
          <circle cx="34" cy="40" r="2.5" fill="#00DF82" opacity="0.85" />
          <text x="21" y="30" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="24" fontWeight="900" fill="#FFFFFF">N</text>
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`nodere-logo nodere-logo--full ${className}`.trim()}
      style={{
        height,
        width
      }}
      aria-label="NODERE"
    >
      <img className="nodere-logo__image nodere-logo__image--dark" src="/nodere-logo-dark.png" alt="NODERE" draggable={false} />
      <img className="nodere-logo__image nodere-logo__image--light" src="/nodere-logo-light.png" alt="" aria-hidden="true" draggable={false} />
    </div>
  );
}

export default Logo;
