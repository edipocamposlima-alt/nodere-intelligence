import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminClient } from "./AdminClient";

export const metadata: Metadata = { title: "Administração | NODERE" };

export default function AdminPage() {
  return <Suspense fallback={null}><AdminClient /></Suspense>;
}
