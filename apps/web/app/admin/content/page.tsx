import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentAdminClient } from "./ContentAdminClient";
export const metadata: Metadata = { title: "Conteúdo e interface | NODERE" };
export default function ContentAdminPage() { return <Suspense fallback={null}><ContentAdminClient /></Suspense>; }
