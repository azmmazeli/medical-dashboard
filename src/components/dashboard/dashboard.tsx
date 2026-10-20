"use client";

import { startOfDay, useNow } from "@/lib/time";
import { Diagnoses } from "./diagnoses";
import { PatientsChart } from "./patients-chart";
import { PatientsList } from "./patients-list";
import { SchedulePanel } from "./schedule-panel";
import { StatCards } from "./stat-cards";
import { VisitDetails } from "./visit-details";

export function Dashboard() {
  const now = useNow();
  const today = now ? startOfDay(now) : null;

  return (
    // From xl up the page is a fixed-height app: each column scrolls on its own.
    <div className="grid gap-3 xl:h-full xl:grid-cols-[minmax(0,1fr)_360px] xl:grid-rows-[minmax(0,1fr)] 2xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="scroll-thin @container min-w-0 rounded-[28px] xl:min-h-0 xl:overflow-y-auto">
        <div className="flex flex-col gap-3">
          <StatCards />
          <div className="grid gap-3 @4xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <Diagnoses />
            <PatientsChart />
          </div>
          <div className="grid gap-3 @3xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
            <PatientsList today={today} />
            <VisitDetails />
          </div>
        </div>
      </div>
      <SchedulePanel now={now} className="xl:min-h-0" />
    </div>
  );
}
