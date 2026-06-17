import { AlertTriangle } from "lucide-react";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-line bg-panel/90 px-6 py-16 text-center">
      <AlertTriangle className="h-8 w-8 text-warning" />
      <p className="max-w-md text-base font-semibold text-[var(--text-primary)]">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary-action px-4 py-2 text-sm">
          Tentar novamente
        </button>
      )}
    </div>
  );
}
