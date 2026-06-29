import type { ReactNode } from "react";
import { PrivateShell } from "@/components/PrivateShell";

export default function CrmLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <PrivateShell>{children}</PrivateShell>;
}
