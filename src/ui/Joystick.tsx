import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { bridge } from "../game/bridge";
import { useUI } from "./store";

interface TouchOrigin {
  id: number;
  x: number;
  y: number;
}
interface JoystickVisual {
  x: number;
  y: number;
  knobX: number;
  knobY: number;
}

export function Joystick() {
  const pointer = useRef<TouchOrigin | null>(null);
  const [visual, setVisual] = useState<JoystickVisual | null>(null);
  const sensitivity = useUI((s) => s.sensitivity);

  useEffect(() => {
    function reset() {
      pointer.current = null;
      setVisual(null);
      bridge.send("move", { x: 0, y: 0 });
    }
    function visibility() {
      if (document.hidden) reset();
    }
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", visibility);
      bridge.send("move", { x: 0, y: 0 });
    };
  }, []);

  function start(e: PointerEvent<HTMLDivElement>) {
    if (pointer.current !== null || e.button !== 0) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    setVisual({
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
      knobX: 0,
      knobY: 0,
    });
    bridge.send("move", { x: 0, y: 0 });
  }

  function update(e: PointerEvent<HTMLDivElement>) {
    const origin = pointer.current;
    if (!origin || origin.id !== e.pointerId) return;
    let x = e.clientX - origin.x,
      y = e.clientY - origin.y;
    const length = Math.hypot(x, y),
      max = 38;
    if (length > max) {
      x = (x / length) * max;
      y = (y / length) * max;
    }
    setVisual((previous) => previous && { ...previous, knobX: x, knobY: y });
    bridge.send(
      "move",
      length < 7
        ? { x: 0, y: 0 }
        : { x: (x / max) * sensitivity, y: (y / max) * sensitivity },
    );
  }

  function stop(e: PointerEvent<HTMLDivElement>) {
    if (pointer.current?.id !== e.pointerId) return;
    pointer.current = null;
    setVisual(null);
    bridge.send("move", { x: 0, y: 0 });
  }

  return (
    <div
      className="joystick-surface"
      role="application"
      aria-label="Chạm và kéo ở bất kỳ đâu để di chuyển"
      onPointerDown={start}
      onPointerMove={update}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
    >
      {visual && (
        <div
          className="joystick"
          aria-hidden="true"
          style={{ left: visual.x, top: visual.y }}
        >
          <span className="joystick-cross" />
          <div
            className="joystick-knob"
            style={{
              transform: `translate(${visual.knobX}px,${visual.knobY}px)`,
            }}
          />
        </div>
      )}
    </div>
  );
}
