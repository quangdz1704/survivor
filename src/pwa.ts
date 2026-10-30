import { registerSW } from "virtual:pwa-register";
let registered = false;
let refresh: ((reload?: boolean) => Promise<void>) | undefined;
const listeners = new Set<() => void>();
export function observeUpdate(listener: () => void) {
  listeners.add(listener);
  if (import.meta.env.PROD && !registered) {
    registered = true;
    refresh = registerSW({
      immediate: true,
      onNeedRefresh: () => listeners.forEach((fn) => fn()),
    });
  }
  return () => {
    listeners.delete(listener);
  };
}
export async function applyUpdate() {
  await refresh?.(true);
}
