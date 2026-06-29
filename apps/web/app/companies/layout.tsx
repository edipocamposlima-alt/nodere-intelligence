import type { ReactNode } from "react";
import { PrivateShell } from "@/components/PrivateShell";

export default function CompaniesLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <PrivateShell>{children}</PrivateShell>;
}
