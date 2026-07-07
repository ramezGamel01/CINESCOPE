import { AlertTriangle } from "lucide-react";

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/40 bg-destructive/10 py-16 text-center">
      <AlertTriangle className="mb-3 h-10 w-10 text-destructive" />
      <h3 className="text-lg font-semibold">Something went wrong</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:brightness-110"
        >
          Try again
        </button>
      )}
    </div>
  );
}
