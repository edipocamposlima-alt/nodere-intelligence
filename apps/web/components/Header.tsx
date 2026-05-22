import { Bell, Search } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/85 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan">NODERE Intelligence</p>
          <h1 className="mt-1 text-xl font-semibold text-white md:text-2xl">Prospecção inteligente Google</h1>
        </div>
        <div className="hidden w-full max-w-md items-center gap-2 rounded-lg border border-line bg-white/5 px-3 py-2 md:flex">
          <Search className="h-4 w-4 text-slate-500" />
          <input className="w-full bg-transparent text-sm text-slate-200 outline-none" placeholder="Buscar empresa, cidade ou segmento" />
        </div>
        <button className="rounded-lg border border-line bg-white/5 p-2 text-slate-300 hover:text-white" aria-label="Notificações">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
