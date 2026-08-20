import { useSyncExternalStore } from "react";

const KEY = "parkease.session";

export type Session = { username: string } | null;

let session: Session = null;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function hydrateSession() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    session = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    session = null;
  }
  hydrated = true;
  emit();
}

export function signIn(username: string, password: string) {
  if (username.trim().toLowerCase() !== "admin" || password !== "admin123") {
    return { ok: false as const, error: "Invalid username or password." };
  }
  session = { username: "admin" };
  hydrated = true;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
  emit();
  return { ok: true as const };
}

export function signOut() {
  session = null;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useSession() {
  const value = useSyncExternalStore(
    subscribe,
    () => session,
    () => null,
  );
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  );
  return { session: value, hydrated: isHydrated };
}
