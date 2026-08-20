import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bike, Bus, CarFront, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { LoadingState, ErrorState } from "@/components/ApiState";
import { Button } from "@/components/ui/button";
import { getSlots, type Slot } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/slots")({
  head: () => ({
    meta: [
      { title: "Slot Status — ParkEase" },
      {
        name: "description",
        content:
          "Visual grid of every parking slot with free or occupied status, vehicle number and filters by bike, car, bus or availability.",
      },
      { property: "og:title", content: "Slot Status — ParkEase" },
      {
        property: "og:description",
        content: "Live grid of free and occupied parking bays.",
      },
    ],
  }),
  component: SlotsPage,
});

const FILTERS = ["All", "Bike", "Car", "Bus", "Available", "Occupied"] as const;
type Filter = (typeof FILTERS)[number];

const ICONS = { BIKE: Bike, CAR: CarFront, BUS: Bus } as const;

function matches(slot: Slot, filter: Filter) {
  switch (filter) {
    case "Bike":
      return slot.type === "BIKE";
    case "Car":
      return slot.type === "CAR";
    case "Bus":
      return slot.type === "BUS";
    case "Available":
      return !slot.occupied;
    case "Occupied":
      return slot.occupied;
    default:
      return true;
  }
}

function SlotsPage() {
  const [filter, setFilter] = useState<Filter>("All");
  const query = useQuery({
    queryKey: ["slots"],
    queryFn: getSlots,
    retry: false,
    refetchInterval: 15000,
  });

  const slots = (query.data ?? []).filter((s) => matches(s, filter));

  return (
    <AppLayout title="Slot Status" subtitle="Live view of every bay in the facility">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => query.refetch()}
          aria-label="Refresh slots"
        >
          <RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"} />
          Refresh
        </Button>
      </div>

      {query.isPending ? (
        <LoadingState label="Loading slots…" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : slots.length === 0 ? (
        <div className="panel p-10 text-center text-sm text-muted-foreground">
          No slots match this filter.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {slots.map((slot) => {
            const Icon = ICONS[slot.type] ?? CarFront;
            return (
              <div
                key={slot.slotId}
                className={cn(
                  "panel p-5",
                  slot.occupied ? "border-destructive/40" : "border-success/40",
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="font-display text-lg font-bold">Slot {slot.slotId}</p>
                      <p className="text-xs text-muted-foreground">{slot.type}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      slot.occupied
                        ? "bg-destructive/10 text-destructive"
                        : "bg-success/10 text-success",
                    )}
                  >
                    {slot.occupied ? "OCCUPIED" : "FREE"}
                  </span>
                </div>
                <p className="mt-4 text-sm">
                  {slot.occupied ? (
                    <span className="font-medium">{slot.vehicleNumber ?? "Unknown vehicle"}</span>
                  ) : (
                    <span className="text-muted-foreground">Ready for the next vehicle</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
