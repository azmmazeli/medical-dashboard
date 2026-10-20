"use client";

import { startOfDay, useNow } from "@/lib/time";
import { PatientsTable } from "./patients-table";
import { StatCards } from "./stat-cards";

export function PatientsDashboard() {
  const now = useNow();
  const today = now ? startOfDay(now) : null;

  return (
    // StatCards lays itself out with container queries.
    <div className="@container flex flex-col gap-3">
      <StatCards />
      <PatientsTable today={today} />
    </div>
  );
}
