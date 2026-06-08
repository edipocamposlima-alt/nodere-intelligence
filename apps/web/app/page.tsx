import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, LineChart, Search, Sparkles, Target, Workflow } from "lucide-react";
import { getBillingPlanLinks } from "@/lib/api";

export const dynamic = "force-dynamic";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "R$ 97",
    description: "Para validar prospecção local com controle simples.",
    benefits: ["300 créditos/mês", "Busca Google Places", "CRM e diagnósticos essenciais"]
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 197",
    description: "Para operação comercial recorrente com IA.",
    benefits: ["1.000 créditos/mês", "IA para abordagem e proposta", "PageSpeed e relatórios comerciais"],
    featured: true
  },
  {
    id: "agency",
    name: "Agency",
    price: "R$ 397",
    description: "Para agências e times com alto volume.",
    benefits: ["Créditos ampliados", "Funil CRM avançado", "Operação multiusuário e integrações"]
  }
];

export default async function LandingPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("nodere_session")?.value || cookieStore.get("nodere-session")?.value;
  if (session) redirect("/dashboard");

  const planLinks = await getBillingPlanLinks().catch(() => ({ starter: null, pro: null, agency: null }));

  return (
    <main className="min-h-screen bg-[#050B16] text-white">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(30,111,219,0.32),transparent_30%),linear-gradient(135deg,#050B16_0%,#0A0F1E_48%,#06162E_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col px-5 py-8 md:px-8">
          <header className="flex items-center justify-between gap-4">
            <Image src="/nodere-wordmark.png" alt="NODERE Intelligence" width={260} height={86} priority className="h-auto w-44 object-contain md:w-64" />
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan/70 md:inline-flex">
                Entrar
              </Link>
              <Link href="/register" className="rounded-xl bg-cyan px-4 py-2 text-sm font-black text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.35)] hover:bg-cyan/90">
                Começar grátis
              </Link>
            </div>
          </header>

          <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="inline-flex rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-cyan">
                Prospecção inteligente + CRM + IA
              </p>
              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Encontre empresas que precisam dos seus serviços. Feche mais contratos.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Prospecção inteligente com diagnóstico digital, CRM e IA — tudo em uma plataforma.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-cyan px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan/90">
                  Começar grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#funcionalidades" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:border-cyan/70">
                  Ver demonstração
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-white/12 bg-white/[0.045] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.38)] backdrop-blur">
              <div className="rounded-2xl border border-cyan/25 bg-[#07111F] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Score médio de oportunidade</p>
                    <p className="mt-2 text-6xl font-black">82</p>
                  </div>
                  <span className="rounded-2xl bg-emerald-400/15 px-3 py-2 text-sm font-black text-emerald-300">Alta intenção</span>
                </div>
                <div className="mt-8 grid gap-3">
                  {["Academias sem site", "Clínicas com baixa avaliação", "Empresas sem Google Ads"].map((item, index) => (
                    <div key={item} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                      <span className="font-semibold">{item}</span>
                      <span className={index === 0 ? "text-cyan" : index === 1 ? "text-amber-300" : "text-emerald-300"}>
                        {index === 0 ? "42 leads" : index === 1 ? "18 alertas" : "31 oportunidades"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-black">Prospecte empresas com baixo score digital e venda a solução certa</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Score de oportunidade automatizado", Target],
            ["Diagnóstico de presença digital em segundos", LineChart],
            ["Funil CRM integrado com IA", Workflow]
          ].map(([label, Icon]) => (
            <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <Icon className="h-7 w-7 text-cyan" />
              <p className="mt-5 text-lg font-bold">{String(label)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <h2 className="text-3xl font-black">Como funciona</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["1", "Busque empresas por segmento e cidade", Search],
            ["2", "Receba um diagnóstico automático de presença digital", Sparkles],
            ["3", "Gere abordagens comerciais com IA e feche negócios", CheckCircle2]
          ].map(([step, title, Icon]) => (
            <div key={String(step)} className="rounded-2xl border border-white/10 bg-[#081120] p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan text-sm font-black text-slate-950">{String(step)}</span>
                <Icon className="h-5 w-5 text-cyan" />
              </div>
              <p className="mt-5 text-lg font-bold">{String(title)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black">Planos comerciais</h2>
            <p className="mt-2 text-slate-400">Comece com a estrutura certa e evolua conforme a operação cresce.</p>
          </div>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => {
            const checkoutUrl = planLinks[plan.id as keyof typeof planLinks];
            return (
              <div key={plan.id} className={`rounded-3xl border p-6 ${plan.featured ? "border-cyan bg-cyan/10 shadow-[0_0_50px_rgba(34,211,238,0.18)]" : "border-white/10 bg-white/[0.04]"}`}>
                {plan.featured && <span className="rounded-full bg-cyan px-3 py-1 text-xs font-black text-slate-950">Mais escolhido</span>}
                <h3 className="mt-4 text-2xl font-black">{plan.name}</h3>
                <p className="mt-2 text-sm text-slate-400">{plan.description}</p>
                <p className="mt-6 text-4xl font-black">{plan.price}<span className="text-base font-semibold text-slate-400">/mês</span></p>
                <ul className="mt-6 space-y-3">
                  {plan.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                      {benefit}
                    </li>
                  ))}
                </ul>
                {checkoutUrl ? (
                  <a href={checkoutUrl} className="mt-7 inline-flex w-full justify-center rounded-xl bg-cyan px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan/90">
                    Assinar agora
                  </a>
                ) : (
                  <a href={`mailto:comercial@nodere.com.br?subject=${encodeURIComponent(`Tenho interesse no plano ${plan.name}`)}`} className="mt-7 inline-flex w-full justify-center rounded-xl border border-cyan/40 bg-cyan/10 px-4 py-3 text-sm font-black text-cyan hover:bg-cyan/20">
                    Tenho interesse
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-slate-400">
        <span>NODERE Intelligence</span>
        <span className="px-2">|</span>
        <Link href="/terms" className="hover:text-cyan">Termos de uso</Link>
        <span className="px-2">|</span>
        <Link href="/privacy" className="hover:text-cyan">Política de privacidade</Link>
        <span className="px-2">|</span>
        <a href="mailto:contato@nodere.com.br" className="hover:text-cyan">contato@nodere.com.br</a>
      </footer>
    </main>
  );
}
