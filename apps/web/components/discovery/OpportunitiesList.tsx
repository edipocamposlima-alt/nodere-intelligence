"use client";

export function OpportunitiesList({ opportunities, suggestions }: { opportunities?: string[]; suggestions?: string[] }) {
  const items = opportunities?.length ? opportunities : ["Nenhuma oportunidade crítica detectada ainda."];
  return (
    <div className="grid gap-3 text-sm">
      <div>
        <p className="mb-2 font-semibold text-[var(--text-primary)]">Oportunidades</p>
        <ul className="space-y-2 text-[var(--text-secondary)]">
          {items.map((item) => <li key={item} className="rounded-md border border-[var(--border-soft)] bg-[var(--bg-hover)] px-3 py-2">{item}</li>)}
        </ul>
      </div>
      {Boolean(suggestions?.length) && (
        <div>
          <p className="mb-2 font-semibold text-[var(--text-primary)]">Ações recomendadas</p>
          <ul className="space-y-2 text-[var(--text-secondary)]">
            {suggestions!.map((item) => <li key={item} className="rounded-md border border-[rgba(0,223,130,0.26)] bg-[rgba(0,223,130,0.10)] px-3 py-2">{item}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
