export default function SettingsPage() {
  return (
    <div className="space-y-5 p-4 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Configurações</h2>
        <p className="mt-1 text-sm text-slate-400">Preferências do MVP e preparação para autenticação, multiusuário e automações.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {["Busca diária automática", "Atualização de notas", "Detecção de novas oportunidades", "Alertas de empresas sem resposta"].map((item) => (
          <label key={item} className="flex items-center justify-between rounded-lg border border-line bg-panel/90 p-4">
            <span className="text-sm text-slate-200">{item}</span>
            <input type="checkbox" defaultChecked className="h-5 w-5 accent-electric" />
          </label>
        ))}
      </div>
    </div>
  );
}
