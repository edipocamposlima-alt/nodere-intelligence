import type { Metadata } from "next";
import TermsPage from "../terms/page";
import CmsPageOverride from "@/components/site/CmsPageOverride";
import SitePageShell from "@/components/site/SitePageShell";

export const metadata: Metadata = {
  title: "Termos de uso | NODERE",
  description: "Termos de uso da plataforma NODERE."
};

export default function LocalizedTermsPage() {
  return <SitePageShell><CmsPageOverride slug="termos" fallback={<TermsPage />} /></SitePageShell>;
}
