import Link from "next/link";

type UpgradeScreenProps = {
  moduleCode: string;
};

export default function UpgradeScreen({ moduleCode }: UpgradeScreenProps) {
  return (
    <section className="grid min-h-[60vh] place-items-center px-4 py-12">
      <div className="w-full max-w-lg rounded-lg border border-line bg-panel p-6 text-center shadow-glow">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan">{moduleCode}</p>
        <h2 className="mt-3 text-2xl font-bold text-white">Modulo indisponivel no plano atual</h2>
        <p className="mt-3 text-sm text-slate-300">
          Faca upgrade para liberar este modulo no seu workspace.
        </p>
        <Link
          href="/app/billing"
          className="mt-6 inline-flex rounded-lg bg-electric px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Ver planos
        </Link>
      </div>
    </section>
  );
}
