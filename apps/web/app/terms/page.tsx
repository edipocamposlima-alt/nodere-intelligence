import Link from "next/link";
import Image from "next/image";
import { getApiBaseUrl } from "@/lib/apiBase";

async function getTerms() {
  try {
    const response = await fetch(`${getApiBaseUrl()}/legal/terms`, { cache: "no-store" });
    if (response.ok) return response.json();
  } catch {
    // Render fallback below.
  }
  return {
    title: "Termos de Uso NODERI",
    updatedAt: "2026-06-02",
    sections: [
      { title: "Uso da plataforma", body: "O NODERI é uma plataforma SaaS para prospecção, CRM e inteligência comercial. Use dados e integrações de forma ética e autorizada." },
      { title: "Credenciais", body: "Secrets e chaves completas devem ficar somente em ambiente protegido de backend, nunca no frontend ou em repositórios públicos." }
    ]
  };
}

export default async function TermsPage() {
  const data = await getTerms();
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-5 md:p-10">
      <div className="flex items-center justify-between gap-4">
        <Image src="/logo-noderi-full.png" alt="NODERI" width={220} height={80} className="h-auto w-44 rounded-lg object-contain" priority />
        <Link href="/login" className="text-sm font-semibold text-cyan">Voltar</Link>
      </div>
      <div>
        <h1 className="text-3xl font-semibold text-white">{data.title}</h1>
        {data.subtitle && <p className="mt-1 text-sm text-cyan">{data.subtitle}</p>}
        <p className="mt-2 text-sm text-slate-400">Atualizado em {new Date(data.updatedAt).toLocaleDateString("pt-BR")}</p>
      </div>
      <section className="space-y-4">
        {data.sections.map((section: { title: string; body: string }) => (
          <article key={section.title} className="rounded-xl border border-line bg-panel/90 p-5">
            <h2 className="text-lg font-semibold text-white">{section.title}</h2>
            <p className="mt-2 leading-7 text-slate-300">{section.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
