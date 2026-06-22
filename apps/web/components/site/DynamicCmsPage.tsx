import Image from "next/image";
import Link from "next/link";
import { RichTextPreview } from "@/components/RichTextEditor";
import type { CmsPage } from "@/lib/publicContent";

export default function DynamicCmsPage({ page }: { page: CmsPage }) {
  return (
    <div className="cms-public-page">
      {page.nodere_cms_sections.map((section, index) => (
        <section className={`cms-public-section cms-public-section--${section.section_type}`} key={section.id}>
          <div className="site-container cms-public-section__inner">
            <div className="cms-public-section__copy">
              {index === 0 && <p className="site-eyebrow">NODERE</p>}
              {section.title && (index === 0 ? <h1>{section.title}</h1> : <h2>{section.title}</h2>)}
              {section.subtitle && <p className="cms-public-section__subtitle">{section.subtitle}</p>}
              {section.body && <RichTextPreview value={section.body} />}
              {section.button_label && section.button_href && <Link className="site-primary" href={section.button_href}>{section.button_label}</Link>}
            </div>
            {section.image_url && <Image className="cms-public-section__image" src={section.image_url} alt={section.title || page.title} width={720} height={480} />}
          </div>
        </section>
      ))}
    </div>
  );
}
