import type { Metadata } from "next";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = { title: "Configurações" };

export default function SettingsPage() {
  return (
    <div className="space-y-5 p-4 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Configurações</h2>
        <p className="mt-1 text-sm text-slate-400">Backend, tema, fonte, layout e instalação do app web.</p>
      </div>
      <SettingsClient />
    </div>
  );
}
