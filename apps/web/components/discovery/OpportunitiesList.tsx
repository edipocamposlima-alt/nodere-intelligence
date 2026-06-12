"use client";

export function OpportunitiesList({ opportunities, suggestions }: { opportunities?: string[]; suggestions?: string[] }) {
  const items = opportunities?.length ? opportunities : ["Nenhuma oportunidade crítica detectada ainda."];
  return (
    <div className="grid gap-3 text-sm">
      <div>
        <p className="mb-2 font-semibold text-white">Oportunidades</p>
        <ul className="space-y-2 text-slate-300">
          {items.map((item) => <li key={item} className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">{item}</li>)}
        </ul>
      </div>
      {Boolean(suggestions?.length) && (
        <div>
          <p className="mb-2 font-semibold text-white">Ações recomendadas</p>
          <ul className="space-y-2 text-slate-300">
            {suggestions!.map((item) => <li key={item} className="rounded-md border border-blue-500/20 bg-blue-500/10 px-3 py-2">{item}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
