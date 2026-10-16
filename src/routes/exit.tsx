
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Loader2, Printer, ReceiptText, TriangleAlert, CircleParking } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exitVehicle, ApiError, formatINR, type ExitResponse } from "@/lib/api";

export const Route = createFileRoute("/exit")({
  head: () => ({
    meta: [
      { title: "Exit Vehicle & Billing — ParkEase" },
      {
        name: "description",
        content:
          "Release a parking slot and generate a printable receipt with entry time, exit time and the parking fee.",
      },
      { property: "og:title", content: "Exit Vehicle — ParkEase" },
      {
        property: "og:description",
        content: "Generate the parking bill and free the slot on vehicle exit.",
      },
    ],
  }),
  component: ExitPage,
});

const schema = z.object({
  numberPlate: z
    .string()
    .trim()
    .toUpperCase()
    .min(4, "Number plate must be at least 4 characters")
    .max(15, "Number plate must be 15 characters or fewer")
    .regex(/^[A-Z0-9-]+$/, "Use letters, numbers and hyphens only"),
});

function ExitPage() {
  const queryClient = useQueryClient();
  const [numberPlate, setNumberPlate] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ExitResponse | null>(null);

  const mutation = useMutation({
    mutationFn: exitVehicle,
    onSuccess: (data) => {
      setReceipt(data);
      queryClient.invalidateQueries({ queryKey: ["status"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["revenue"] });
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setReceipt(null);
    const parsed = schema.safeParse({ numberPlate });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setValidationError(null);
    mutation.mutate(parsed.data);
  }

  const apiError = mutation.error;

  return (
    <AppLayout title="Exit Vehicle" subtitle="Close the parking session and generate the bill">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <form onSubmit={onSubmit} className="panel no-print space-y-5 p-6">
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

          {validationError && <p className="text-sm text-destructive">{validationError}</p>}

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ReceiptText className="size-4" />
            )}
            Generate Bill
          </Button>
        </form>

        <div className="space-y-4">
          {apiError && (
            <div className="panel no-print flex items-start gap-3 border-destructive/40 p-5">
              <TriangleAlert className="mt-0.5 size-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  {apiError instanceof ApiError && apiError.offline
                    ? "Backend unavailable"
                    : "Could not process exit"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {apiError instanceof Error ? apiError.message : "Unexpected error"}
                </p>
              </div>
            </div>
          )}

          {receipt && receipt.success === false && (
            <div className="panel no-print flex items-start gap-3 border-warning/50 p-5">
              <TriangleAlert className="mt-0.5 size-5 text-warning" />
              <p className="text-sm">{receipt.message ?? "Vehicle not found in the parking lot."}</p>
            </div>
          )}

          {receipt?.success && <Receipt receipt={receipt} />}

          {!apiError && !receipt && (
            <div className="panel p-6 text-sm text-muted-foreground">
              Enter the number plate to close the session. Entry time, exit time and the fee are
              calculated by the parking API.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Receipt({ receipt }: { receipt: ExitResponse }) {
  return (
    <div className="panel print-area p-6">
      <div className="flex items-start justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <img
            src="/parkease-logo.png"
            alt="ParkEase logo"
            className="size-9 rounded-lg object-cover"
          />
          <div>
            <p className="font-display text-lg font-bold">ParkEase</p>
            <p className="text-xs text-muted-foreground">Where Smart Parking Begins</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">Parking Receipt</p>
          <p className="text-xs text-muted-foreground">Slot #{receipt.slotId ?? "—"}</p>
        </div>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <Row label="Vehicle Number" value={receipt.vehicleNumber ?? "—"} />
        <Row label="Vehicle Type" value={receipt.vehicleType ?? "—"} />
        <Row label="Slot" value={receipt.slotId != null ? `#${receipt.slotId}` : "—"} />
        <Row label="Entry Time" value={receipt.entryTime ?? "—"} />
        <Row label="Exit Time" value={receipt.exitTime ?? "—"} />
      </dl>

      <div className="mt-6 flex items-center justify-between rounded-lg bg-brand/10 p-4">
        <span className="text-sm font-medium">Total Fee</span>
        <span className="font-display text-2xl font-bold text-brand">
          {receipt.fee != null ? formatINR(receipt.fee) : "—"}
        </span>
      </div>

      <Button
        variant="outline"
        className="no-print mt-5 w-full sm:w-auto"
        onClick={() => window.print()}
      >
        <Printer className="size-4" />
        Print Receipt
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
