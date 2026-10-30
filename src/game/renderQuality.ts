/** Bound fill rate on small-core devices while keeping the same world framing. */
export function renderScale() {
  const cores = navigator.hardwareConcurrency;
  const cap = cores > 0 && cores <= 4 ? 1.5 : 2;
  return Math.min(window.devicePixelRatio || 1, cap);
}
