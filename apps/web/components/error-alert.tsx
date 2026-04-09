/**
 * Consistent error display component.
 * Replaces ad-hoc error rendering throughout the app.
 */

'use client';

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export function ErrorAlert({ message, onDismiss, onRetry }: ErrorAlertProps) {
  return (
    <div className="border border-red-500/20 bg-red-500/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-red-400/70">
            Error
          </p>
          <p className="text-xs leading-relaxed text-red-400/90">{message}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="font-mono text-[10px] uppercase tracking-wider text-foreground/50 hover:text-foreground"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="font-mono text-[10px] text-foreground/30 hover:text-foreground/50"
            >
              &times;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
