"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { getDiagnoses } from "@/lib/data";
import { useApp } from "../app-shell";
import { Card, cx } from "../ui";

const W = 260;
const H = 236;
const CX = W / 2;
const CY = 120;
const R = 84;
const RINGS = 4;

function point(index: number, count: number, radius: number) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return [CX + Math.cos(angle) * radius, CY + Math.sin(angle) * radius] as const;
}

export function Diagnoses() {
  const { range } = useApp();
  const [activeId, setActiveId] = useState<string | null>(null);
  const items = getDiagnoses(range);
  const count = items.length;
  // Outer ring sits at the next multiple of 5 above the largest share.
  const max = Math.ceil(Math.max(...items.map((d) => d.pct)) / 5) * 5;

  const ring = (radius: number) => items.map((_, i) => point(i, count, radius).join(",")).join(" ");
  const shape = items.map((d, i) => point(i, count, (d.pct / max) * R).join(",")).join(" ");

  return (
    <Card className="p-7">
      <h2 className="text-[22px] font-medium">Diagnoses</h2>
      <div className="@container mt-2">
        <div className="flex flex-col items-center gap-4 @sm:flex-row">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Radar chart of diagnosis share" className="w-full max-w-[280px] shrink-0 @sm:w-[52%]">
            {Array.from({ length: RINGS }, (_, i) => (
              <polygon key={i} points={ring((R * (i + 1)) / RINGS)} fill="none" className="stroke-line" strokeWidth={1} />
            ))}
            {items.map((d, i) => {
              const [x, y] = point(i, count, R);
              return <line key={d.id} x1={CX} y1={CY} x2={x} y2={y} className="stroke-line" strokeWidth={1} />;
            })}
            <polygon points={shape} className="fill-brand/25 stroke-brand" strokeWidth={1.5} strokeLinejoin="round" />
            {items.map((d, i) => {
              const [x, y] = point(i, count, (d.pct / max) * R);
              const [lx, ly] = point(i, count, R + 18);
              const active = d.id === activeId;
              return (
                <g key={d.id} onPointerEnter={() => setActiveId(d.id)} onPointerLeave={() => setActiveId(null)}>
                  <title>{`${d.full}: ${d.pct}%`}</title>
                  <circle cx={x} cy={y} r={12} fill="transparent" />
                  <circle cx={x} cy={y} r={active ? 5 : 3} className="fill-brand stroke-card" strokeWidth={active ? 2 : 0} />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={cx("text-[12px]", active ? "fill-fg font-semibold" : "fill-muted")}
                  >
                    {d.pct}%
                  </text>
                </g>
              );
            })}
          </svg>

          <ul className="w-full min-w-0 flex-1">
            {items.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  title={d.full}
                  aria-pressed={d.id === activeId}
                  onPointerEnter={() => setActiveId(d.id)}
                  onPointerLeave={() => setActiveId(null)}
                  onFocus={() => setActiveId(d.id)}
                  onBlur={() => setActiveId(null)}
                  className={cx(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-[16px]",
                    d.id === activeId && "bg-soft",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-1 font-medium">
                    <span className="truncate">{d.name}</span>
                    {d.id !== "oth" && <ChevronRight className="size-4 shrink-0 text-muted" />}
                  </span>
                  <span className="text-muted tabular-nums">{d.pct}%</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
