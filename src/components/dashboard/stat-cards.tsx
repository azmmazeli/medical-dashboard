"use client";

import { CircleHelp } from "lucide-react";
import { getStats } from "@/lib/data";
import { useApp } from "../app-shell";
import { Card, cx } from "../ui";

export function StatCards() {
  const { range, addedPatients, removedPatients } = useApp();

  return (
    // 2 columns, then 3 + 2 (on a 6-track grid so the last row fills), then all 5 in a row.
    <div className="grid grid-cols-2 gap-3 @lg:grid-cols-6 @4xl:grid-cols-5">
      {getStats(range, addedPatients, removedPatients).map((stat, i) => (
        <Card
          key={stat.id}
          className={cx(
            "flex min-h-[150px] flex-col px-6 py-5 @4xl:col-span-1",
            i < 3 ? "@lg:col-span-2" : "@lg:col-span-3",
            i === 4 && "col-span-2",
          )}
        >
          <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
            <p className="text-[32px] leading-10 font-semibold">{stat.value}</p>
            {stat.delta && (
              <span
                className={cx(
                  "mt-1 rounded-full px-2 py-0.5 text-[13px]",
                  stat.delta.tone === "good" ? "bg-good-soft text-good" : "bg-bad-soft text-bad",
                )}
              >
                {stat.delta.text}
              </span>
            )}
          </div>
          {stat.unit && <p className="text-[16px]">{stat.unit}</p>}
          <p className="mt-auto flex items-center gap-2 pt-3 text-[16px] text-muted">
            {stat.label}
            {stat.hint && (
              <span tabIndex={0} title={stat.hint} aria-label={stat.hint} className="rounded-full opacity-60 hover:opacity-100">
                <CircleHelp className="size-4" />
              </span>
            )}
          </p>
        </Card>
      ))}
    </div>
  );
}
