import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DynamicCmsPage from "@/components/site/DynamicCmsPage";
import SitePageShell from "@/components/site/SitePageShell";
import { getPublicPage } from "@/lib/publicContent";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicPage(slug);
  return page ? { title: page.seo_title || `${page.title} | NODERE`, description: page.seo_description || page.subtitle } : {};
}

export default async function CmsRoute({ params }: Props) {
  const { slug } = await params;
  const page = await getPublicPage(slug);
  if (!page || !page.nodere_cms_sections.length) notFound();
  return <SitePageShell><DynamicCmsPage page={page} /></SitePageShell>;
}
