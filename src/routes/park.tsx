import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { CircleParking, CircleCheck, Loader2, TriangleAlert } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parkVehicle, ApiError, type VehicleType, type ParkResponse } from "@/lib/api";

export const Route = createFileRoute("/park")({
  head: () => ({
    meta: [
      { title: "Park Vehicle — ParkEase" },
      {
        name: "description",
        content:
          "Allocate a parking slot by entering the vehicle number plate and vehicle type; ParkEase assigns the next free bay.",
      },
      { property: "og:title", content: "Park Vehicle — ParkEase" },
      {
        property: "og:description",
        content: "Assign a parking slot to an incoming bike, car or bus.",
      },
    ],
  }),
  component: ParkPage,
});

const schema = z.object({
  numberPlate: z
    .string()
    .trim()
    .toUpperCase()
    .min(4, "Number plate must be at least 4 characters")
    .max(15, "Number plate must be 15 characters or fewer")
    .regex(/^[A-Z0-9-]+$/, "Use letters, numbers and hyphens only"),
  type: z.enum(["BIKE", "CAR", "BUS"]),
});

function ParkPage() {
  const queryClient = useQueryClient();
  const [numberPlate, setNumberPlate] = useState("");
  const [type, setType] = useState<VehicleType>("CAR");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [result, setResult] = useState<ParkResponse | null>(null);

  const mutation = useMutation({
    mutationFn: parkVehicle,
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["status"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    const parsed = schema.safeParse({ numberPlate, type });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setValidationError(null);
    mutation.mutate(parsed.data);
  }

  const apiError = mutation.error;
  const failed = result && result.success === false;

  return (
    <AppLayout title="Park Vehicle" subtitle="Assign the next available slot to an arriving vehicle">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <form onSubmit={onSubmit} className="panel space-y-5 p-6">
          <div className="space-y-2">
            <Label htmlFor="plate">Number Plate</Label>
            <Input
              id="plate"
              value={numberPlate}
              maxLength={15}
              placeholder="MH04AB1234"
              onChange={(e) => {
                setNumberPlate(e.target.value.toUpperCase());
                setValidationError(null);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Vehicle Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as VehicleType)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BIKE">BIKE</SelectItem>
                <SelectItem value="CAR">CAR</SelectItem>
                <SelectItem value="BUS">BUS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {validationError && <p className="text-sm text-destructive">{validationError}</p>}

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CircleParking className="size-4" />
            )}
            Park Vehicle
          </Button>
        </form>

        <div className="space-y-4">
          {apiError && (
            <div className="panel flex items-start gap-3 border-destructive/40 p-5">
              <TriangleAlert className="mt-0.5 size-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  {apiError instanceof ApiError && apiError.offline
                    ? "Backend unavailable"
                    : "Could not park vehicle"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {apiError instanceof Error ? apiError.message : "Unexpected error"}
                </p>
              </div>
            </div>
          )}

          {failed && (
            <div className="panel flex items-start gap-3 border-warning/50 p-5">
              <TriangleAlert className="mt-0.5 size-5 text-warning" />
              <div>
                <p className="font-medium">Slot not assigned</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result?.message ?? "No slot available for this vehicle type."}
                </p>
              </div>
            </div>
          )}

          {result?.success && (
            <div className="panel p-6">
              <div className="flex items-center gap-3">
                <CircleCheck className="size-6 text-success" />
                <p className="font-semibold">{result.message ?? "Vehicle parked successfully."}</p>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <Detail label="Slot" value={result.slotId != null ? `#${result.slotId}` : "—"} />
                <Detail label="Number Plate" value={result.numberPlate ?? numberPlate} />
                <Detail label="Type" value={result.type ?? type} />
              </div>
            </div>
          )}

          {!apiError && !result && (
            <div className="panel p-6 text-sm text-muted-foreground">
              Enter the vehicle details to allocate a slot. The assigned slot number comes from the
              parking API.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold">{value}</p>
    </div>
  );
}
