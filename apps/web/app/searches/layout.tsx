import type { ReactNode } from "react";
import { PrivateShell } from "@/components/PrivateShell";

export default function SearchesLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <PrivateShell>{children}</PrivateShell>;
}
