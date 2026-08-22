import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CircleParking, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, useSession, hydrateSession } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ParkEase Login — Smart Parking Management System" },
      {
        name: "description",
        content:
          "Sign in to ParkEase, the smart parking management console for slot allocation, vehicle exit billing and revenue tracking.",
      },
      { property: "og:title", content: "ParkEase — Where Smart Parking Begins" },
      {
        property: "og:description",
        content: "Admin login for the ParkEase smart parking management system.",
      },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  username: z.string().trim().min(1, "Username is required").max(50),
  password: z.string().min(1, "Password is required").max(100),
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, hydrated } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    hydrateSession();
  }, []);

  useEffect(() => {
    if (hydrated && session) navigate({ to: "/dashboard" });
  }, [hydrated, session, navigate]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ username, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setPending(true);
    const result = signIn(parsed.data.username, parsed.data.password);
    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen bg-hero">
      <div className="hidden flex-1 flex-col justify-between p-12 lg:flex">
        <span className="flex items-center gap-3">
          <img
            src={logoAsset.url}
            alt="ParkEase logo"
            className="size-10 rounded-xl object-cover"
          />
          <span className="font-display text-xl font-bold">ParkEase</span>
        </span>
        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Where <span className="text-gradient-brand">Smart Parking</span> Begins
          </h1>
          <p className="mt-4 text-muted-foreground">
            Real-time slot allocation, automated exit billing and revenue insight for your parking
            facility — all in one console.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Smart Parking Management System</p>
      </div>

      <div className="flex w-full items-center justify-center p-6 lg:w-[480px] lg:bg-background">
        <form onSubmit={onSubmit} className="panel w-full max-w-sm p-8">
          <div className="mb-6 text-center">
            <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground">
              <CircleParking className="size-6" />
            </span>
            <h2 className="text-xl font-bold">Sign in to ParkEase</h2>
            <p className="mt-1 text-sm text-muted-foreground">Admin access to the parking console</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                maxLength={50}
                autoComplete="username"
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                placeholder="admin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                maxLength={100}
                autoComplete="current-password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              Login
            </Button>
          </div>

          <div className="mt-6 rounded-lg bg-muted p-3 text-center text-xs text-muted-foreground">
            Demo credentials — <span className="font-medium text-foreground">admin</span> /{" "}
            <span className="font-medium text-foreground">admin123</span>
          </div>
        </form>
      </div>
    </div>
  );
}
