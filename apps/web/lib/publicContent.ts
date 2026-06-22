import { cache } from "react";
import { getApiBaseUrl } from "@/lib/apiBase";

export type CmsSection = {
  id: string;
  section_key: string;
  section_type: string;
  title?: string;
  subtitle?: string;
  body?: string;
  image_url?: string;
  button_label?: string;
  button_href?: string;
  sort_order: number;
};

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  seo_title?: string;
  seo_description?: string;
  nodere_cms_sections: CmsSection[];
};

export type CmsNavigation = { id: string; label: string; href: string; location: string; sort_order: number };

export const getPublicPage = cache(async (slug: string): Promise<CmsPage | null> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/content/pages?slug=${encodeURIComponent(slug)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500)
    });
    if (!response.ok) return null;
    const payload = await response.json() as { pages?: CmsPage[] };
    return payload.pages?.[0] || null;
  } catch {
    return null;
  }
});
