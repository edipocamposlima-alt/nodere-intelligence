import type { ReactNode } from "react";
import { PrivateShell } from "@/components/PrivateShell";

export default function ReportsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <PrivateShell>{children}</PrivateShell>;
}
