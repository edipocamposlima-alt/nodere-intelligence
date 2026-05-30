import Image from "next/image";
import Link from "next/link";
import { LockKeyhole, Mail } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink p-4">
      <div className="w-full max-w-md rounded-lg border border-line bg-panel p-6 shadow-glow">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-2xl border border-electric/30 bg-electric/10 p-3 shadow-glow">
            <Image src="/nodere-logo.png" alt="NODERE" width={72} height={72} className="rounded-xl object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-white">NODERE</h1>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan">Intelligence</p>
            <p className="mt-2 text-sm text-slate-400">Scanner comercial de oportunidades Google</p>
          </div>
        </div>

        <form className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm text-slate-300">E-mail</span>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2">
              <Mail className="h-4 w-4 text-slate-500" />
              <input type="email" placeholder="voce@agencia.com" className="w-full bg-transparent text-sm outline-none" />
            </div>
          </label>

          <label className="block">
            <span className="text-sm text-slate-300">Senha</span>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2">
              <LockKeyhole className="h-4 w-4 text-slate-500" />
              <input type="password" placeholder="••••••••" className="w-full bg-transparent text-sm outline-none" />
            </div>
          </label>

          <Link href="/" className="block rounded-lg bg-electric px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-500">
            Entrar
          </Link>
        </form>
      </div>
    </div>
  );
}
