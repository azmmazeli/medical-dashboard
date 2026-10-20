"use client";

import { useState, type FormEvent } from "react";
import type { Patient } from "@/lib/data";
import { addDays, fromDateKey, toDateKey, toMinutes } from "@/lib/time";
import { Dialog, cx, fieldClass, labelClass } from "../ui";

const DAY_MS = 86_400_000;
const VISIT_TYPES = ["Consultation", "Follow-up appointment", "Post-operation"];

/** Comma- or line-separated text to a clean list. */
function toList(text: string) {
  return text
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Placeholder values are saved for empty fields; show them as empty again when editing. */
const unless = (value: string | undefined, placeholder: string) => (value === placeholder ? "" : value);

/** Form for a new patient, or for editing `patient` when one is given. */
export function PatientDialog({
  patient,
  today,
  onClose,
  onSave,
}: {
  patient?: Patient;
  today: Date;
  onClose: () => void;
  onSave: (patient: Patient) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const appointment = patient?.appointment;
  const visit = patient?.visit;
  const date = toDateKey(appointment ? addDays(today, appointment.dayOffset) : today);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    const name = text("name");
    const start = text("start");
    const end = text("end");
    if (toMinutes(end) <= toMinutes(start)) {
      setError("End time must be after the start time.");
      return;
    }

    const suffix = crypto.randomUUID().slice(0, 4);
    const initials = name
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const type = text("type");

    onSave({
      id: patient?.id ?? `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${suffix}`,
      name,
      sex: text("sex") as Patient["sex"],
      age: Number(text("age")),
      // A stable avatar colour from the name.
      hue: patient?.hue ?? [...name].reduce((sum, char) => sum + char.charCodeAt(0) * 7, 0) % 360,
      appointment: {
        dayOffset: Math.round((fromDateKey(text("date")).getTime() - today.getTime()) / DAY_MS),
        start,
        end,
        type,
        location: text("location") || "To be assigned",
        tag: appointment && appointment.type === type ? appointment.tag : type === "Post-operation" ? "Post-operation" : patient ? undefined : "New Patient",
      },
      visit: {
        code: visit?.code ?? `NEW-${initials}${text("age")}-${suffix.toUpperCase()}`,
        symptoms: toList(text("symptoms")),
        lastChecked: visit?.lastChecked ?? "Not seen yet",
        observation: text("observation") || "—",
        diagnosis: text("diagnosis") || "Not diagnosed yet",
        prescription: toList(text("prescription")).length ? toList(text("prescription")) : ["None"],
        notes: text("notes") || "—",
      },
    });
    onClose();
  };

  const full = cx(labelClass, "col-span-2");
  const half = cx(labelClass, "col-span-2 sm:col-span-1");

  return (
    <Dialog title={patient ? "Edit patient" : "Add patient"} onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <label className={full}>
            Full name
            <input name="name" required maxLength={60} autoFocus defaultValue={patient?.name} placeholder="e.g. Sarah Collins" className={fieldClass} />
          </label>
          <label className={half}>
            Sex
            <select name="sex" defaultValue={patient?.sex ?? "Female"} className={fieldClass}>
              <option>Female</option>
              <option>Male</option>
            </select>
          </label>
          <label className={half}>
            Age
            <input name="age" type="number" required min={0} max={120} defaultValue={patient?.age} placeholder="e.g. 45" className={fieldClass} />
          </label>

          <p className="col-span-2 mt-2 text-[16px] font-medium">Appointment</p>
          <label className={half}>
            Visit type
            <select name="type" defaultValue={appointment?.type ?? VISIT_TYPES[0]} className={fieldClass}>
              {VISIT_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className={half}>
            Date
            <input name="date" type="date" required min={toDateKey(today)} defaultValue={date} className={fieldClass} />
          </label>
          <label className={half}>
            Starts
            <input name="start" type="time" required defaultValue={appointment?.start ?? "10:00"} onChange={() => setError(null)} className={fieldClass} />
          </label>
          <label className={half}>
            Ends
            <input name="end" type="time" required defaultValue={appointment?.end ?? "10:30"} onChange={() => setError(null)} className={fieldClass} />
          </label>
          <label className={full}>
            Location
            <input name="location" maxLength={60} defaultValue={unless(appointment?.location, "To be assigned")} placeholder="e.g. Room 210, Clinic Wing A" className={fieldClass} />
          </label>

          <p className="col-span-2 mt-2 text-[16px] font-medium">Medical information</p>
          <label className={full}>
            Symptoms
            <input name="symptoms" maxLength={120} defaultValue={visit?.symptoms.join(", ")} placeholder="Separate with commas, e.g. Fever, Cough" className={fieldClass} />
          </label>
          <label className={full}>
            Observation
            <input name="observation" maxLength={200} defaultValue={unless(visit?.observation, "—")} className={fieldClass} />
          </label>
          <label className={full}>
            Diagnosis
            <input name="diagnosis" maxLength={200} defaultValue={unless(visit?.diagnosis, "Not diagnosed yet")} className={fieldClass} />
          </label>
          <label className={full}>
            Prescription
            <input name="prescription" maxLength={200} defaultValue={unless(visit?.prescription.join(", "), "None")} placeholder="Separate with commas" className={fieldClass} />
          </label>
          <label className={full}>
            Notes
            <textarea name="notes" rows={2} maxLength={300} defaultValue={unless(visit?.notes, "—")} className={cx(fieldClass, "resize-none")} />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-2xl bg-bad-soft px-3.5 py-2 text-[14px] text-bad">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full bg-soft px-5 py-2.5 hover:bg-soft-hover">
            Cancel
          </button>
          <button type="submit" className="rounded-full bg-inverse px-5 py-2.5 text-inverse-fg">
            {patient ? "Save changes" : "Add patient"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
