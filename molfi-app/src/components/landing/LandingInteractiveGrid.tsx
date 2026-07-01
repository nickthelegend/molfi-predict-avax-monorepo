import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const CELL = 56;
const STAGGER_MS = 30;
const FADE_MS = 850;
const PEAK_OPACITY = 0.22;

type Cell = { col: number; row: number };

function cellsAlongLine(from: Cell | null, to: Cell): Cell[] {
  if (!from) return [to];

  const cells: Cell[] = [];
  let x0 = from.col;
  let y0 = from.row;
  const x1 = to.col;
  const y1 = to.row;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    cells.push({ col: x0, row: y0 });
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return cells;
}

function cellIndex(col: number, row: number, cols: number) {
  return row * cols + col;
}

export function LandingInteractiveGrid({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activateAtRef = useRef<Float64Array | null>(null);
  const dimsRef = useRef({ cols: 0, rows: 0 });
  const lastCellRef = useRef<Cell | null>(null);
  const paintRafRef = useRef(0);
  const moveRafRef = useRef(0);
  const pendingPointRef = useRef<{ x: number; y: number } | null>(null);
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [dims, setDims] = useState({ cols: 0, rows: 0 });

  const syncDims = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;

    const cols = Math.max(1, Math.ceil(el.clientWidth / CELL));
    const rows = Math.max(1, Math.ceil(el.clientHeight / CELL));
    if (dimsRef.current.cols === cols && dimsRef.current.rows === rows) return;

    dimsRef.current = { cols, rows };
    activateAtRef.current = new Float64Array(cols * rows);
    cellRefs.current = new Array(cols * rows).fill(null);
    lastCellRef.current = null;
    setDims({ cols, rows });
  }, []);

  const paint = useCallback(() => {
    const activateAt = activateAtRef.current;
    const cells = cellRefs.current;
    if (!activateAt) return;

    const now = performance.now();
    let animating = false;

    for (let i = 0; i < activateAt.length; i++) {
      const cell = cells[i];
      const scheduled = activateAt[i];

      if (!scheduled) {
        if (cell) {
          cell.style.removeProperty("background-color");
          cell.style.removeProperty("border-color");
          cell.style.removeProperty("box-shadow");
        }
        continue;
      }

      const age = now - scheduled;
      if (age < 0) {
        animating = true;
        continue;
      }

      const heat = Math.max(0, 1 - age / FADE_MS);
      if (heat <= 0.01) {
        activateAt[i] = 0;
        if (cell) {
          cell.style.removeProperty("background-color");
          cell.style.removeProperty("border-color");
          cell.style.removeProperty("box-shadow");
        }
        continue;
      }

      animating = true;
      if (!cell) continue;

      const fill = (PEAK_OPACITY * heat * 100).toFixed(1);
      const line = (4 + heat * 24).toFixed(1);
      cell.style.backgroundColor = `color-mix(in oklab, var(--color-accent) ${fill}%, transparent)`;
      cell.style.borderColor = `color-mix(in oklab, var(--color-accent) ${line}%, transparent)`;
      cell.style.boxShadow = `inset 0 0 ${(heat * 18).toFixed(0)}px color-mix(in oklab, var(--color-accent) ${(heat * 12).toFixed(0)}%, transparent)`;
    }

    paintRafRef.current = animating ? requestAnimationFrame(paint) : 0;
  }, []);

  const schedulePaint = useCallback(() => {
    if (!paintRafRef.current) {
      paintRafRef.current = requestAnimationFrame(paint);
    }
  }, [paint]);

  const ignite = useCallback(
    (x: number, y: number) => {
      if (reducedMotion) return;

      const { cols, rows } = dimsRef.current;
      const activateAt = activateAtRef.current;
      if (!activateAt || cols === 0 || rows === 0) return;

      const col = Math.min(cols - 1, Math.max(0, Math.floor(x / CELL)));
      const row = Math.min(rows - 1, Math.max(0, Math.floor(y / CELL)));
      const target = { col, row };

      if (
        lastCellRef.current?.col === target.col &&
        lastCellRef.current?.row === target.row
      ) {
        return;
      }

      const path = cellsAlongLine(lastCellRef.current, target);
      const capped = path.length > 24 ? path.slice(path.length - 24) : path;
      const baseTime = performance.now();

      for (let step = 0; step < capped.length; step++) {
        const cell = capped[step];
        const i = cellIndex(cell.col, cell.row, cols);
        if (i < 0 || i >= activateAt.length) continue;
        activateAt[i] = baseTime + step * STAGGER_MS;
      }

      lastCellRef.current = target;
      schedulePaint();
    },
    [schedulePaint, reducedMotion],
  );

  const flushPointer = useCallback(() => {
    moveRafRef.current = 0;
    const point = pendingPointRef.current;
    pendingPointRef.current = null;
    if (point) ignite(point.x, point.y);
  }, [ignite]);

  const queuePointer = useCallback(
    (x: number, y: number) => {
      pendingPointRef.current = { x, y };
      if (!moveRafRef.current) {
        moveRafRef.current = requestAnimationFrame(flushPointer);
      }
    },
    [flushPointer],
  );

  useEffect(() => {
    if (reducedMotion) return;
    syncDims();

    const el = rootRef.current;
    if (!el) return;

    const ro = new ResizeObserver(syncDims);
    ro.observe(el);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(paintRafRef.current);
      cancelAnimationFrame(moveRafRef.current);
    };
  }, [syncDims, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const root = rootRef.current;
    const hero = root?.closest(".landing-hero");
    if (!root || !hero) return;

    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      queuePointer(event.clientX - rect.left, event.clientY - rect.top);
    };

    const onLeave = () => {
      lastCellRef.current = null;
      activateAtRef.current?.fill(0);
      schedulePaint();
    };

    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);

    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
    };
  }, [queuePointer, schedulePaint, dims.cols, dims.rows, reducedMotion]);

  const count = dims.cols * dims.rows;

  return (
    <div
      ref={rootRef}
      className={cn(
        "landing-interactive-grid",
        reducedMotion && "landing-interactive-grid--static",
        className,
      )}
      aria-hidden
    >
      {!reducedMotion &&
        Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            cellRefs.current[i] = el;
          }}
          className="landing-grid-cell"
        />
      ))}
    </div>
  );
}