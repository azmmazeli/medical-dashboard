"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Patient } from "@/lib/data";
import { addDays } from "@/lib/time";
import { useApp } from "../app-shell";
import { Avatar, Card, Dialog, cx } from "../ui";
import { PatientDialog } from "./patient-dialog";

type SortKey = "name" | "sex" | "age" | "appointment" | "type" | "location";

const byAppointment = (a: Patient, b: Patient) =>
  a.appointment.dayOffset - b.appointment.dayOffset || a.appointment.start.localeCompare(b.appointment.start);

const COLUMNS: { key: SortKey; label: string; compare: (a: Patient, b: Patient) => number }[] = [
  { key: "name", label: "Patient", compare: (a, b) => a.name.localeCompare(b.name) },
  { key: "sex", label: "Sex", compare: (a, b) => a.sex.localeCompare(b.sex) },
  { key: "age", label: "Age", compare: (a, b) => a.age - b.age },
  { key: "appointment", label: "Appointment", compare: byAppointment },
  { key: "type", label: "Visit type", compare: (a, b) => a.appointment.type.localeCompare(b.appointment.type) },
  { key: "location", label: "Location", compare: (a, b) => a.appointment.location.localeCompare(b.appointment.location) },
];

/** "12 Oct 2026, 09:15". Only the time until the client knows today's date. */
function appointmentLabel(patient: Patient, today: Date | null) {
  const { dayOffset, start, end } = patient.appointment;
  const time = `${start} — ${end}`;
  if (!today) return time;
  const day = addDays(today, dayOffset).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${day}, ${time}`;
}

export function PatientsTable({ today }: { today: Date | null }) {
  const router = useRouter();
  const { patients: allPatients, addPatient, updatePatient, removePatient, selectedPatientId, selectPatient } = useApp();
  // The patient open in the form: "new" for a blank form, or one being edited.
  const [editing, setEditing] = useState<Patient | "new" | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "appointment", desc: false });

  const q = query.trim().toLowerCase();
  const compare = COLUMNS.find((column) => column.key === sort.key)!.compare;
  const patients = allPatients
    .filter(
      (p) =>
        !q ||
        [p.name, p.appointment.type, p.appointment.location, p.visit.diagnosis, p.visit.code].some((text) => text.toLowerCase().includes(q)),
    )
    .sort((a, b) => (sort.desc ? -1 : 1) * (compare(a, b) || byAppointment(a, b)));

  const sortBy = (key: SortKey) => setSort((current) => ({ key, desc: current.key === key && !current.desc }));

  // Visit details live on the main dashboard, so open the patient there.
  const openPatient = (id: string) => {
    selectPatient(id);
    router.push("/");
  };

  const cell = "px-4 py-3.5 first:pl-7 last:pr-7";

  return (
    <Card className="pt-7 pb-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-7">
        <div>
          <h1 className="text-[22px] font-medium">Patients</h1>
          <p className="text-[15px] text-muted">
            {patients.length} {patients.length === 1 ? "patient" : "patients"}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full bg-soft px-4 sm:w-72 sm:flex-none">
            <Search className="size-5 shrink-0 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label="Search patients"
              className="w-full min-w-0 bg-transparent text-[16px] outline-none placeholder:text-muted"
            />
          </label>
          {/* Appointment dates are stored relative to today, so wait until it is known. */}
          <button
            type="button"
            disabled={!today}
            onClick={() => setEditing("new")}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-inverse pr-5 pl-4 text-inverse-fg disabled:opacity-50"
          >
            <Plus className="size-5" /> Add patient
          </button>
        </div>
      </div>

      <div className="scroll-thin mt-4 overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left text-[15px]">
          <thead>
            <tr className="border-b border-line text-muted">
              {COLUMNS.map((column) => {
                const active = sort.key === column.key;
                const Icon = !active ? ChevronsUpDown : sort.desc ? ArrowDown : ArrowUp;
                return (
                  <th key={column.key} scope="col" aria-sort={active ? (sort.desc ? "descending" : "ascending") : undefined} className={cx(cell, "font-normal")}>
                    <button
                      type="button"
                      onClick={() => sortBy(column.key)}
                      className={cx("flex items-center gap-1.5 whitespace-nowrap hover:text-fg", active && "text-fg")}
                    >
                      {column.label}
                      <Icon className={cx("size-4", !active && "opacity-50")} />
                    </button>
                  </th>
                );
              })}
              <th scope="col" className={cx(cell, "font-normal")}>
                Diagnosis
              </th>
              <th scope="col" className={cell}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => {
              const { appointment, visit } = patient;
              return (
                <tr
                  key={patient.id}
                  className={cx("border-b border-line last:border-0 hover:bg-soft", patient.id === selectedPatientId && "bg-soft")}
                >
                  <td className={cell}>
                    <button
                      type="button"
                      onClick={() => openPatient(patient.id)}
                      title="Open visit details"
                      className="group flex items-center gap-3 text-left"
                    >
                      <Avatar name={patient.name} hue={patient.hue} className="size-10" />
                      <span className="min-w-0">
                        <span className="block text-[16px] font-medium whitespace-nowrap group-hover:underline">{patient.name}</span>
                        <span className="block text-[13px] text-muted">{visit.code}</span>
                      </span>
                    </button>
                  </td>
                  <td className={cell}>{patient.sex}</td>
                  <td className={cx(cell, "tabular-nums")}>{patient.age}</td>
                  <td className={cx(cell, "whitespace-nowrap tabular-nums")}>{appointmentLabel(patient, today)}</td>
                  <td className={cell}>
                    <span className="whitespace-nowrap">{appointment.type}</span>
                    {appointment.tag && appointment.tag !== appointment.type && (
                      <span className="ml-2 rounded-full bg-tag-soft px-2.5 py-0.5 text-[13px] font-medium whitespace-nowrap text-tag">
                        {appointment.tag}
                      </span>
                    )}
                  </td>
                  <td className={cx(cell, "whitespace-nowrap")}>{appointment.location}</td>
                  <td className={cell}>
                    <span title={visit.diagnosis} className="line-clamp-2 max-w-[320px] min-w-[200px]">
                      {visit.diagnosis}
                    </span>
                  </td>
                  <td className={cell}>
                    <span className="flex gap-2">
                      <button
                        type="button"
                        disabled={!today}
                        onClick={() => setEditing(patient)}
                        aria-label={`Edit ${patient.name}`}
                        title="Edit"
                        className="grid size-9 place-items-center rounded-full border border-line hover:bg-soft-hover disabled:opacity-50"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(patient)}
                        aria-label={`Delete ${patient.name}`}
                        title="Delete"
                        className="grid size-9 place-items-center rounded-full border border-line text-bad hover:bg-bad-soft"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {patients.length === 0 && <p className="px-7 py-10 text-center text-muted">No patients match “{query.trim()}”.</p>}
      </div>

      {editing && today && (
        <PatientDialog
          patient={editing === "new" ? undefined : editing}
          today={today}
          onClose={() => setEditing(null)}
          onSave={(patient) => {
            if (editing === "new") {
              addPatient(patient);
              selectPatient(patient.id);
              // Make sure the new row is not hidden by a leftover search.
              setQuery("");
            } else {
              updatePatient(patient);
            }
          }}
        />
      )}

      {deleting && (
        <Dialog title="Delete patient" onClose={() => setDeleting(null)}>
          <p className="mt-4 text-[16px]">
            Delete <span className="font-medium">{deleting.name}</span>? Their appointment and visit details will be removed too.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setDeleting(null)} className="rounded-full bg-soft px-5 py-2.5 hover:bg-soft-hover">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                removePatient(deleting.id);
                setDeleting(null);
              }}
              className="rounded-full bg-bad px-5 py-2.5 text-white dark:text-inverse-fg"
            >
              Delete
            </button>
          </div>
        </Dialog>
      )}
    </Card>
  );
}
