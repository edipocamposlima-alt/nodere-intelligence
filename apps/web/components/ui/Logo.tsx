"use client";

interface LogoProps {
  variant?: "icon" | "full";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  xs: { icon: 20, height: 14 },
  sm: { icon: 28, height: 18 },
  md: { icon: 36, height: 22 },
  lg: { icon: 48, height: 30 },
  xl: { icon: 96, height: 74 }
};

export function Logo({ variant = "full", size = "md", className = "" }: LogoProps) {
  const { icon: iconSize, height: textHeight } = SIZES[size];
  const source = variant === "icon" ? "/logo-noderi-icon.png" : "/logo-noderi-full.png";

  return (
    <div className={`flex shrink-0 items-center gap-2.5 ${className}`} aria-label="NODERI Nexus">
      <img
        src={source}
        alt={variant === "icon" ? "NODERI" : "NODERI Nexus"}
        width={variant === "icon" ? iconSize : undefined}
        height={variant === "icon" ? iconSize : textHeight}
        style={{
          objectFit: "contain",
          flexShrink: 0,
          height: variant === "icon" ? iconSize : textHeight,
          width: "auto"
        }}
        draggable={false}
      />
    </div>
  );
}

export function LogoIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo-noderi-icon.png"
      alt="NODERI"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
      draggable={false}
    />
  );
}
