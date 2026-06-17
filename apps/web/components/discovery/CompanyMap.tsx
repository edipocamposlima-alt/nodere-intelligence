"use client";

import { MapPin } from "lucide-react";
import { Company } from "@/lib/types";

export function CompanyMap({ company }: { company?: Company | null }) {
  const query = company ? [company.name, company.address, company.city, company.state].filter(Boolean).join(" ") : "Brasil";
  const mapsUrl = company?.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)]">
      <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <MapPin className="h-4 w-4 text-[var(--brand-primary)]" />
          Google Maps
        </div>
        <a className="text-xs font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-glow)]" href={mapsUrl} target="_blank" rel="noreferrer">Abrir mapa</a>
      </div>
      <iframe
        title="Mapa da empresa"
        className="h-64 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
      />
    </div>
  );
}
