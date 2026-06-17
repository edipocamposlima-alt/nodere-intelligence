import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  glow?: boolean;
}

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8"
};

export function Card({ children, className, padding = "md", glow }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-border-soft bg-bg-card shadow-card-light dark:shadow-card",
        glow && "border-brand-glow/30 shadow-glow",
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
