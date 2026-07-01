import { STATUS_BADGE_BASE_CLASS, STATUS_DOT_CLASS, getStatusTone, getStatusTooltip } from "@/lib/statusPalette";

export function StatusBadge({ value }: { value: string }) {
  const tone = getStatusTone(value);

  return (
    <span
      className={STATUS_BADGE_BASE_CLASS}
      data-tone={tone}
      title={getStatusTooltip(value, tone)}
    >
      <span className={STATUS_DOT_CLASS} aria-hidden="true" />
      {value}
    </span>
  );
}
