"use client";

import { ReactNode } from "react";
import { useModules } from "@/hooks/useModules";
import UpgradeScreen from "./UpgradeScreen";

type ModuleGuardProps = {
  moduleCode: string;
  children: ReactNode;
};

export default function ModuleGuard({ moduleCode, children }: ModuleGuardProps) {
  const { hasModule, loading } = useModules();

  if (loading) return <div className="h-24 animate-pulse rounded-lg border border-line bg-panel" />;
  if (!hasModule(moduleCode)) return <UpgradeScreen moduleCode={moduleCode} />;

  return <>{children}</>;
}
