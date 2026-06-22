import type { ReactNode } from "react";
import DynamicCmsPage from "@/components/site/DynamicCmsPage";
import { getPublicPage } from "@/lib/publicContent";

export default async function CmsPageOverride({ slug, fallback }: { slug: string; fallback: ReactNode }) {
  const page = await getPublicPage(slug);
  return page?.nodere_cms_sections?.length ? <DynamicCmsPage page={page} /> : fallback;
}
