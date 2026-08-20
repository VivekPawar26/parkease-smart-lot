import { AlertTriangle, Loader2, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError, API_BASE_URL } from "@/lib/api";

export function LoadingState({ label = "Loading data…" }: { label?: string }) {
  return (
    <div className="panel flex items-center justify-center gap-3 p-10 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const offline = error instanceof ApiError && error.offline;
  const message =
    error instanceof Error ? error.message : "Something went wrong while contacting the API.";

  return (
    <div className="panel flex flex-col items-center gap-3 p-10 text-center">
      {offline ? (
        <ServerCrash className="size-8 text-destructive" />
      ) : (
        <AlertTriangle className="size-8 text-warning" />
      )}
      <p className="font-medium">{offline ? "Backend unavailable" : "Request failed"}</p>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {offline && <p className="text-xs text-muted-foreground">API base URL: {API_BASE_URL}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
