import { useEffect, useRef } from "react";
/** Keep keyboard navigation in the foreground panel and restore its opener. */
export function useDialogFocus() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null,
      panel = ref.current;
    const buttons = () => [
      ...(panel?.querySelectorAll<HTMLElement>(
        'button:not(:disabled),input:not(:disabled),[tabindex="0"]',
      ) ?? []),
    ];
    buttons()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = buttons();
      if (!nodes.length) return;
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    panel?.addEventListener("keydown", key);
    return () => {
      panel?.removeEventListener("keydown", key);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return ref;
}
