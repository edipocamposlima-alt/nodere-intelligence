"use client";

interface LogoProps {
  variant?: "full" | "icon";
  height?: number;
  className?: string;
}

export function Logo({ variant = "full", height = 32, className = "" }: LogoProps) {
  const src = variant === "icon" ? "/nodere-icon-official.png" : "/nodere-logo-official.png";
  const width = variant === "icon" ? height : Math.round(height * 3.4);

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
        <img src={src} alt="NODERE" width={height} height={height} style={{ display: "block", height, width, objectFit: "contain" }} draggable={false} />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
        height
      }}
    >
      <img src={src} alt="NODERE" width={width} height={height} style={{ display: "block", height, width: "auto", maxWidth: "100%", objectFit: "contain" }} draggable={false} />
    </div>
  );
}

export default Logo;
