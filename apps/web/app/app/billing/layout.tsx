import type { ReactNode } from "react";
import { PrivateShell } from "@/components/PrivateShell";

export default function AppBillingLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <PrivateShell>{children}</PrivateShell>;
}
