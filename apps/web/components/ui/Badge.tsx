import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "ai" | "purple" | "orange";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  title?: string;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: "nodere-status-badge",
  success: "nodere-status-badge",
  warning: "nodere-status-badge",
  danger: "nodere-status-badge",
  info: "nodere-status-badge",
  ai: "border-[var(--ai-border)] bg-[var(--ai-bg)] text-[var(--ai-text)]",
  purple: "border-[color:rgb(124_58_237_/_0.2)] bg-[var(--purple-dark-soft)] text-[var(--purple)]",
  orange: "nodere-status-badge"
};

const dataTone: Partial<Record<BadgeVariant, string>> = {
  default: "neutral",
  success: "done",
  warning: "moderate",
  danger: "critical",
  info: "progress",
  orange: "waiting"
};

export function Badge({ children, variant = "default", className, title }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center", badgeVariants[variant], className)} data-tone={dataTone[variant]} title={title}>
      {children}
    </span>
  );
}
