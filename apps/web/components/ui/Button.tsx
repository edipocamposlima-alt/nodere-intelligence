import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ai" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-primary text-white hover:bg-brand-hover focus:ring-2 focus:ring-brand-glow/35",
  secondary: "border border-border-soft bg-bg-hover text-text-primary hover:bg-bg-card",
  outline: "border border-brand-primary bg-transparent text-brand-primary hover:bg-brand-primary/10",
  danger: "bg-[var(--danger)] text-white hover:bg-red-700",
  ai: "border border-[var(--ai-border)] bg-[var(--ai-bg)] text-[var(--ai-text)] hover:opacity-90",
  ghost: "bg-transparent text-text-muted hover:bg-bg-hover hover:text-text-primary"
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 rounded-button px-3 text-sm",
  md: "h-10 rounded-button px-4 text-sm",
  lg: "h-12 rounded-button px-6 text-base"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, icon, children, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "nodere-action inline-flex items-center justify-center gap-2 font-medium transition-all duration-150",
        "focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? <span className="nodere-icon nodere-icon-spin animate-spin rounded-full border-2 border-current border-t-transparent" /> : icon ? <span className="nodere-icon-slot">{icon}</span> : null}
      {children}
    </button>
  )
);

Button.displayName = "Button";
