"use client";

import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { getPatientFlow } from "@/lib/data";
import { useApp } from "../app-shell";
import { Card, cx } from "../ui";

const LEFT = 30;
const RIGHT = 8;
const TOP = 12;
const BOTTOM = 30;
const Y_TICKS = 6;

const SERIES = [
  { key: "male", label: "Male", color: "var(--series-male)" },
  { key: "female", label: "Female", color: "var(--series-female)" },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

/** Smooth path through the points (Catmull-Rom converted to cubic Béziers). */
function smoothPath(points: [number, number][], floor: number) {
  return points.reduce((path, [x, y], i) => {
    if (i === 0) return `M${x},${y}`;
    const p0 = points[i - 2] ?? points[i - 1];
    const p1 = points[i - 1];
    const p3 = points[i + 1] ?? points[i];
    const c1 = [p1[0] + (x - p0[0]) / 6, Math.min(floor, p1[1] + (y - p0[1]) / 6)];
    const c2 = [x - (p3[0] - p1[0]) / 6, Math.min(floor, y - (p3[1] - p1[1]) / 6)];
    return `${path} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${x},${y}`;
  }, "");
}

/** Tracks an element's rendered size so the chart can draw at real pixels. */
function useSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

export function PatientsChart() {
  const { range } = useApp();
  const gradientId = useId();
  const [hidden, setHidden] = useState<SeriesKey[]>([]);
  const [hover, setHover] = useState<number | null>(null);
  const [plotRef, { width: W, height: H }] = useSize();
  const PLOT_W = Math.max(1, W - LEFT - RIGHT);
  const PLOT_H = Math.max(1, H - TOP - BOTTOM);

  const data = getPatientFlow(range);
  const visible = SERIES.filter((s) => !hidden.includes(s.key));
  const peak = Math.max(1, ...data.flatMap((d) => visible.map((s) => d[s.key])));
  const step = [1, 2, 5, 10, 20, 50, 100].find((s) => s * Y_TICKS >= peak) ?? 200;
  const yMax = step * Y_TICKS;

  const x = (i: number) => LEFT + (PLOT_W * i) / (data.length - 1);
  const y = (value: number) => TOP + PLOT_H - (PLOT_H * value) / yMax;
  const baseline = y(0);
  const labelEvery = Math.ceil(data.length / 7);
  // The pointer can outlive a range switch, so clamp to the current data.
  const active = hover !== null && hover < data.length ? hover : null;

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = event.clientX - rect.left;
    const index = Math.round(((svgX - LEFT) / PLOT_W) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, index)));
  };

  const toggle = (key: SeriesKey) =>
    setHidden((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]));

  return (
    <Card className="flex flex-col p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[22px] font-medium">Patients</h2>
        <div className="flex items-center gap-1">
          {SERIES.map((s) => {
            const on = !hidden.includes(s.key);
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(s.key)}
                title={on ? `Hide ${s.label}` : `Show ${s.label}`}
                className={cx("flex items-center gap-2 rounded-full px-2.5 py-1 text-[14px] hover:bg-soft", !on && "text-muted line-through")}
              >
                <span className="size-2 rounded-full" style={{ background: on ? s.color : "var(--muted)" }} />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div ref={plotRef} className="relative mt-3 min-h-[250px] flex-1">
        <svg
          width={W}
          height={H}
          role="img"
          aria-label="Patients seen over time, by sex"
          className={cx("absolute inset-0 touch-none", W === 0 && "invisible")}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            {SERIES.map((s) => (
              <linearGradient key={s.key} id={`${gradientId}-${s.key}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" style={{ stopColor: s.color, stopOpacity: 0.55 }} />
                <stop offset="100%" style={{ stopColor: s.color, stopOpacity: 0.04 }} />
              </linearGradient>
            ))}
          </defs>

          {Array.from({ length: Y_TICKS + 1 }, (_, i) => (
            <g key={i}>
              <line x1={LEFT} x2={W - RIGHT} y1={y(i * step)} y2={y(i * step)} className="stroke-line" strokeWidth={1} />
              <text x={LEFT - 10} y={y(i * step)} textAnchor="end" dominantBaseline="middle" className="fill-muted text-[13px]">
                {i * step}
              </text>
            </g>
          ))}
          {data.map(
            (d, i) =>
              i % labelEvery === 0 && (
                <text key={d.label} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} className="fill-muted text-[13px]">
                  {d.label}
                </text>
              ),
          )}

          {visible.map((s) => {
            const points = data.map((d, i) => [x(i), y(d[s.key])] as [number, number]);
            const line = smoothPath(points, baseline);
            return (
              <g key={s.key}>
                <path d={`${line} L${x(data.length - 1)},${baseline} L${x(0)},${baseline} Z`} fill={`url(#${gradientId}-${s.key})`} />
                <path d={line} fill="none" strokeWidth={2} strokeLinecap="round" style={{ stroke: s.color }} />
              </g>
            );
          })}

          {active !== null && (
            <g pointerEvents="none">
              <line x1={x(active)} x2={x(active)} y1={TOP} y2={baseline} className="stroke-muted" strokeWidth={1} strokeDasharray="3 3" />
              {visible.map((s) => (
                <circle key={s.key} cx={x(active)} cy={y(data[active][s.key])} r={4.5} className="stroke-card" strokeWidth={2} style={{ fill: s.color }} />
              ))}
            </g>
          )}
        </svg>

        {active !== null && (
          <div
            className="pointer-events-none absolute top-1 z-10 rounded-xl border border-line bg-card px-3 py-2 text-[13px] shadow-lg shadow-black/10"
            style={
              active > data.length / 2
                ? { right: W - x(active) + 12 }
                : { left: x(active) + 12 }
            }
          >
            <p className="mb-1 text-muted">{data[active].label}</p>
            {visible.map((s) => (
              <p key={s.key} className="flex items-center gap-2 whitespace-nowrap">
                <span className="size-2 rounded-full" style={{ background: s.color }} />
                {s.label}
                <span className="ml-auto pl-3 font-medium tabular-nums">{data[active][s.key]}</span>
              </p>
            ))}
            {visible.length === 0 && <p className="text-muted">No series shown</p>}
          </div>
        )}
      </div>
    </Card>
  );
}
