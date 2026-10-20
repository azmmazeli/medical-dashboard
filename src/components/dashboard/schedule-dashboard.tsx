"use client";

import { useNow } from "@/lib/time";
import { SchedulePanel } from "./schedule-panel";

export function ScheduleDashboard() {
  const now = useNow();

  // From xl up the panel fills the page and its timeline scrolls on its own.
  return <SchedulePanel now={now} className="xl:h-full xl:min-h-0" />;
}
