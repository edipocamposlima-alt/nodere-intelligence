import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "ai" | "purple" | "orange";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: "border-border-soft bg-bg-hover text-text-secondary",
  success: "border-[color:rgb(22_163_74_/_0.2)] bg-[var(--success-dark-soft)] text-[var(--success)]",
  warning: "border-[color:rgb(245_158_11_/_0.2)] bg-[var(--warning-dark-soft)] text-[var(--warning)]",
  danger: "border-[color:rgb(220_38_38_/_0.2)] bg-[var(--danger-dark-soft)] text-[var(--danger)]",
  info: "border-[color:rgb(37_99_235_/_0.2)] bg-[var(--info-dark-soft)] text-[var(--info)]",
  ai: "border-[var(--ai-border)] bg-[var(--ai-bg)] text-[var(--ai-text)]",
  purple: "border-[color:rgb(124_58_237_/_0.2)] bg-[var(--purple-dark-soft)] text-[var(--purple)]",
  orange: "border-[color:rgb(249_115_22_/_0.2)] bg-[var(--orange-dark-soft)] text-[var(--orange)]"
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-badge border px-2.5 py-0.5 text-xs font-medium", badgeVariants[variant], className)}>
      {children}
    </span>
  );
}
