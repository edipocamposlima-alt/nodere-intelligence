import Link from "next/link";
import { Bell, Search, ShieldCheck } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/90 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-electric/30 bg-electric/15 text-sm font-black text-white">N</span>
          <span className="hidden text-sm font-semibold text-white sm:inline">NODERE</span>
        </Link>

        <div className="hidden w-full max-w-md items-center gap-2 rounded-lg border border-line bg-white/5 px-3 py-2 md:flex">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            className="w-full bg-transparent text-sm text-slate-200 outline-none"
            placeholder="Buscar empresa, cidade ou segmento"
          />
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin" className="inline-flex items-center gap-2 rounded-lg border border-electric/40 bg-electric/10 px-3 py-2 text-sm font-semibold text-blue-200 hover:bg-electric/20">
            <ShieldCheck className="h-4 w-4" />
            Admin
          </Link>
          <button
            className="rounded-lg border border-line bg-white/5 p-2 text-slate-300 hover:text-white"
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
