"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import type { Patient } from "@/lib/data";
import { addDays } from "@/lib/time";
import { useApp } from "../app-shell";
import { Avatar, Card, Select, cx } from "../ui";

type Sort = "upcoming" | "name" | "type";

const SORTS: { value: Sort; label: string }[] = [
  { value: "upcoming", label: "By upcoming" },
  { value: "name", label: "By name" },
  { value: "type", label: "By visit type" },
];

const byUpcoming = (a: Patient, b: Patient) =>
  a.appointment.dayOffset - b.appointment.dayOffset || a.appointment.start.localeCompare(b.appointment.start);

const comparators: Record<Sort, (a: Patient, b: Patient) => number> = {
  upcoming: byUpcoming,
  name: (a, b) => a.name.localeCompare(b.name),
  type: (a, b) => a.appointment.type.localeCompare(b.appointment.type) || byUpcoming(a, b),
};

/** "09:15" for today, "Oct 13, 9:00" for later days. */
function appointmentLabel(patient: Patient, today: Date | null) {
  const { dayOffset, start } = patient.appointment;
  if (dayOffset === 0 || !today) return start;
  const day = addDays(today, dayOffset).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${day}, ${start.replace(/^0/, "")}`;
}

export function PatientsList({ today }: { today: Date | null }) {
  const { patients: allPatients, selectedPatientId, selectPatient } = useApp();
  const [sort, setSort] = useState<Sort>("upcoming");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const patients = allPatients
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.appointment.type.toLowerCase().includes(q))
    .sort(comparators[sort]);

  return (
    <Card className="flex max-h-[600px] min-h-0 flex-col p-7 pb-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[22px] font-medium">Patients list</h2>
        <Select value={sort} options={SORTS} onChange={setSort} label="Sort patients" />
      </div>

      <label className="mt-4 flex h-11 shrink-0 items-center gap-3 rounded-full bg-soft px-4">
        <Search className="size-5 shrink-0 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          aria-label="Search the patients list"
          className="w-full min-w-0 bg-transparent text-[16px] outline-none placeholder:text-muted"
        />
      </label>

      <ul className="scroll-thin -mx-2 mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-4">
        {patients.map((patient) => {
          const selected = patient.id === selectedPatientId;
          return (
            <li key={patient.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => selectPatient(patient.id)}
                className={cx(
                  "flex w-full items-center gap-3 rounded-[26px] p-3.5 text-left transition-colors",
                  selected ? "bg-inverse text-inverse-fg" : "bg-soft hover:bg-soft-hover",
                )}
              >
                <Avatar name={patient.name} hue={patient.hue} className="size-12" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] font-medium">{patient.name}</span>
                  <span className={cx("block truncate text-[14px]", selected ? "opacity-70" : "text-muted")}>{patient.appointment.type}</span>
                </span>
                <span className={cx("shrink-0 pr-1 text-[16px] tabular-nums", !selected && "text-muted")}>
                  {appointmentLabel(patient, today)}
                </span>
              </button>
            </li>
          );
        })}
        {patients.length === 0 && <li className="px-2 py-6 text-center text-muted">No patients match “{query.trim()}”.</li>}
      </ul>
    </Card>
  );
}
