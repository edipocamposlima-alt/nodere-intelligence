import type { Metadata } from "next";
import PrivacyPage from "../privacy/page";
import CmsPageOverride from "@/components/site/CmsPageOverride";
import SitePageShell from "@/components/site/SitePageShell";

export const metadata: Metadata = {
  title: "Privacidade | NODERE",
  description: "Politica de privacidade da plataforma NODERE."
};

export default function LocalizedPrivacyPage() {
  return <SitePageShell><CmsPageOverride slug="privacidade" fallback={<PrivacyPage />} /></SitePageShell>;
}
