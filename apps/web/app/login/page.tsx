import Image from "next/image";
import Link from "next/link";
import { LockKeyhole, Mail } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink p-4">
      <div className="w-full max-w-md rounded-lg border border-line bg-panel p-6 shadow-glow">
        <div className="flex items-center gap-3">
          <Image src="/leadradar-logo.png" alt="LeadRadar" width={56} height={56} className="rounded-xl object-cover" />
          <div>
            <h1 className="text-xl font-semibold text-white">LeadRadar</h1>
            <p className="text-sm text-slate-400">Acesso ao scanner comercial</p>
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
