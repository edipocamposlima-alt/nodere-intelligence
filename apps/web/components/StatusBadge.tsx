import clsx from "clsx";

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
        value === "Alta" && "border-danger/40 bg-danger/10 text-red-200",
        value === "Media" && "border-warning/40 bg-warning/10 text-amber-200",
        value === "Baixa" && "border-success/40 bg-success/10 text-emerald-200",
        !["Alta", "Media", "Baixa"].includes(value) && "border-line bg-white/5 text-slate-300"
      )}
    >
      {value}
    </span>
  );
}
