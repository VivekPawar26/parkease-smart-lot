import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Grid3X3,
  CircleParking,
  CarFront,
  Bike,
  Bus,
  IndianRupee,
  CircleCheck,
  CircleSlash,
  RefreshCw,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { LoadingState, ErrorState } from "@/components/ApiState";
import { Button } from "@/components/ui/button";
import { getStatus, formatINR, type TypeStatus } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ParkEase Smart Parking" },
      {
        name: "description",
        content:
          "Live parking dashboard with total, available and occupied slots, per-vehicle breakdown and total revenue.",
      },
      { property: "og:title", content: "ParkEase Dashboard" },
      {
        property: "og:description",
        content: "Live slot occupancy and revenue for your parking facility.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const query = useQuery({
    queryKey: ["status"],
    queryFn: getStatus,
    retry: false,
    refetchInterval: 15000,
  });

  return (
    <AppLayout title="Dashboard" subtitle="Live parking occupancy and revenue">
      <div className="mb-6 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>
          <RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"} />
          Refresh
        </Button>
      </div>

      {query.isPending ? (
        <LoadingState label="Loading dashboard…" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <Dashboard data={query.data} />
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <QuickAction to="/park" icon={CircleParking} label="Park Vehicle" />
        <QuickAction to="/exit" icon={CarFront} label="Exit Vehicle" />
        <QuickAction to="/slots" icon={Grid3X3} label="View Slots" />
      </div>
    </AppLayout>
  );
}

function Dashboard({ data }: { data: Awaited<ReturnType<typeof getStatus>> }) {
  const occupancy = data.totalSlots > 0 ? (data.occupiedSlots / data.totalSlots) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Slots" value={String(data.totalSlots)} icon={Grid3X3} tone="info" />
        <StatCard
          label="Available Slots"
          value={String(data.availableSlots)}
          icon={CircleCheck}
          tone="success"
        />
        <StatCard
          label="Occupied Slots"
          value={String(data.occupiedSlots)}
          icon={CircleSlash}
          tone="danger"
        />
        <StatCard
          label="Total Revenue"
          value={formatINR(data.totalRevenue)}
          icon={IndianRupee}
          tone="brand"
        />
      </div>

      <div className="panel p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Overall occupancy</h2>
          <span className="text-sm text-muted-foreground">{Math.round(occupancy)}% full</span>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand-gradient transition-all"
            style={{ width: `${occupancy}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {data.occupiedSlots} of {data.totalSlots} slots in use
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <TypeCard title="Bikes" icon={Bike} stats={data.bike} />
        <TypeCard title="Cars" icon={CarFront} stats={data.car} />
        <TypeCard title="Buses" icon={Bus} stats={data.bus} />
      </div>
    </div>
  );
}

const TONES = {
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  danger: "bg-destructive/10 text-destructive",
  brand: "bg-brand/10 text-brand",
} as const;

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone: keyof typeof TONES;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`flex size-9 items-center justify-center rounded-lg ${TONES[tone]}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function TypeCard({
  title,
  icon: Icon,
  stats,
}: {
  title: string;
  icon: React.ElementType;
  stats: TypeStatus;
}) {
  const pct = stats.total > 0 ? (stats.occupied / stats.total) * 100 : 0;
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </span>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{stats.total} slots</p>
        </div>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex justify-between text-sm">
        <span className="text-success">{stats.available} available</span>
        <span className="text-muted-foreground">{stats.occupied} occupied</span>
      </div>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: "/park" | "/exit" | "/slots";
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="panel flex items-center gap-3 p-5 transition-colors hover:border-brand"
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon className="size-5" />
      </span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
