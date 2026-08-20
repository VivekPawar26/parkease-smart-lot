import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { LoadingState, ErrorState } from "@/components/ApiState";
import { Button } from "@/components/ui/button";
import { getRevenue, formatINR } from "@/lib/api";

export const Route = createFileRoute("/revenue")({
  head: () => ({
    meta: [
      { title: "Revenue — ParkEase" },
      {
        name: "description",
        content:
          "Total parking revenue collected, reported in Indian Rupees directly from the ParkEase parking API.",
      },
      { property: "og:title", content: "Revenue — ParkEase" },
      { property: "og:description", content: "Total parking revenue collected to date." },
    ],
  }),
  component: RevenuePage,
});

function RevenuePage() {
  const query = useQuery({
    queryKey: ["revenue"],
    queryFn: getRevenue,
    retry: false,
    refetchInterval: 30000,
  });

  return (
    <AppLayout title="Revenue" subtitle="Total collections from completed parking sessions">
      {query.isPending ? (
        <LoadingState label="Loading revenue…" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <div className="panel max-w-lg p-8">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground">
              <IndianRupee className="size-6" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="font-display text-3xl font-bold">
                {formatINR(query.data.totalRevenue)}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-6" onClick={() => query.refetch()}>
            <RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>
        </div>
      )}
    </AppLayout>
  );
}
