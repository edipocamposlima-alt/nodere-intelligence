import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-text-secondary">
          {label}
          {props.required && <span className="ml-1 text-[var(--danger)]">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted">{icon}</span>}
        <input
          ref={ref}
          className={cn(
            "h-10 w-full rounded-input border bg-bg-input text-sm text-text-primary transition-colors placeholder:text-text-muted",
            "focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-glow/20",
            error ? "border-[var(--danger)]" : "border-border-default",
            icon ? "pl-9 pr-3" : "px-3",
            className
          )}
          {...props}
        />
      </div>
      {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
    </div>
  )
);

Input.displayName = "Input";
