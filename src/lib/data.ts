/**
 * Mock data layer. Components only import the types and the get* functions at
 * the bottom, so swapping these for database queries later should not touch
 * the UI.
 */

export type Range = "today" | "week" | "month";

export type Stat = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  delta?: { text: string; tone: "good" | "bad" };
  hint?: string;
};

export type Diagnosis = { id: string; name: string; full: string; pct: number };

export type FlowPoint = { label: string; male: number; female: number };

export type Patient = {
  id: string;
  name: string;
  sex: "Male" | "Female";
  age: number;
  hue: number;
  appointment: {
    /** Days from today. Becomes a real date column once there is a database. */
    dayOffset: number;
    start: string;
    end: string;
    type: string;
    location: string;
    tag?: string;
  };
  visit: {
    code: string;
    symptoms: string[];
    lastChecked: string;
    observation: string;
    diagnosis: string;
    prescription: string[];
    notes: string;
  };
};

export type EventKind = "patient" | "meeting" | "lab" | "surgery";

export type ScheduleEvent = {
  id: string;
  kind: EventKind;
  title: string;
  location: string;
  start: string;
  end: string;
  tag?: string;
  patientId?: string;
  /** Added by the user rather than derived from appointments; can be removed. */
  custom?: boolean;
};

/** A user-added event, pinned to a calendar date ("2026-10-12"). */
export type CustomEvent = ScheduleEvent & { date: string };

export type Notification = { id: string; title: string; body: string; time: string };

export const doctor = { name: "Dr. Michael Reynolds", role: "Cardiologist", initials: "MR" };

const stats: Record<Range, Stat[]> = {
  today: [
    { id: "total", label: "Total patients", value: "27", delta: { text: "+1,2%", tone: "good" } },
    { id: "new", label: "New patients", value: "3" },
    { id: "time", label: "Time for appt", value: "42", unit: "minutes", delta: { text: "+3,8%", tone: "bad" }, hint: "Average appointment length. Longer than the previous period." },
    { id: "age", label: "Patients age", value: "26", unit: "years old", hint: "Median age of patients seen in this period." },
    { id: "pss", label: "PSS", value: "4.98", delta: { text: "+1,2%", tone: "good" }, hint: "Patient satisfaction score, out of 5." },
  ],
  week: [
    { id: "total", label: "Total patients", value: "164", delta: { text: "+4,6%", tone: "good" } },
    { id: "new", label: "New patients", value: "19" },
    { id: "time", label: "Time for appt", value: "39", unit: "minutes", delta: { text: "-1,4%", tone: "good" }, hint: "Average appointment length. Shorter than the previous period." },
    { id: "age", label: "Patients age", value: "34", unit: "years old", hint: "Median age of patients seen in this period." },
    { id: "pss", label: "PSS", value: "4.91", delta: { text: "+0,4%", tone: "good" }, hint: "Patient satisfaction score, out of 5." },
  ],
  month: [
    { id: "total", label: "Total patients", value: "702", delta: { text: "+8,1%", tone: "good" } },
    { id: "new", label: "New patients", value: "86" },
    { id: "time", label: "Time for appt", value: "40", unit: "minutes", delta: { text: "+0,9%", tone: "bad" }, hint: "Average appointment length. Longer than the previous period." },
    { id: "age", label: "Patients age", value: "37", unit: "years old", hint: "Median age of patients seen in this period." },
    { id: "pss", label: "PSS", value: "4.87", delta: { text: "-0,3%", tone: "bad" }, hint: "Patient satisfaction score, out of 5." },
  ],
};

const diagnosisNames: Omit<Diagnosis, "pct">[] = [
  { id: "htn", name: "HTN", full: "Hypertension" },
  { id: "dys", name: "Dyslipidemia", full: "Dyslipidemia" },
  { id: "cad", name: "CAD/Angina", full: "Coronary artery disease / angina" },
  { id: "arr", name: "Arrhythmias", full: "Arrhythmias" },
  { id: "hf", name: "Heart Failure", full: "Heart failure" },
  { id: "pmi", name: "Post-MI/PCI", full: "Post myocardial infarction / PCI follow-up" },
  { id: "oth", name: "Other", full: "Other diagnoses" },
];

const diagnosisShare: Record<Range, number[]> = {
  today: [24, 20, 16, 12, 8, 6, 14],
  week: [22, 21, 15, 13, 9, 7, 13],
  month: [23, 19, 17, 11, 10, 6, 14],
};

const flow: Record<Range, FlowPoint[]> = {
  today: [
    [5, 9], [6, 7], [4, 8], [2, 6], [3, 5], [6, 9], [8, 12], [9, 8], [7, 5], [5, 6], [8, 5], [10, 8], [9, 7],
  ].map(([male, female], i) => ({ label: `${8 + i}:00`, male, female })),
  week: [
    ["Mon", 32, 36], ["Tue", 41, 39], ["Wed", 38, 44], ["Thu", 45, 40], ["Fri", 36, 42], ["Sat", 18, 22], ["Sun", 9, 12],
  ].map(([label, male, female]) => ({ label: String(label), male: Number(male), female: Number(female) })),
  month: [
    [1, 30, 35], [5, 42, 40], [10, 38, 46], [15, 51, 43], [20, 44, 52], [25, 39, 41], [30, 47, 45],
  ].map(([day, male, female]) => ({ label: `Day ${day}`, male, female })),
};

const patients: Patient[] = [
  {
    id: "thompson-carter",
    name: "Thompson Carter",
    sex: "Male",
    age: 28,
    hue: 28,
    appointment: { dayOffset: 0, start: "09:15", end: "10:00", type: "Consultation", location: "Room 305B, Clinic Wing B", tag: "New Patient" },
    visit: {
      code: "ECG-CD45-MK9",
      symptoms: ["Fever", "Cough", "Chest Pain"],
      lastChecked: "Dr. Patel on 18 Apr 2026",
      observation: "Elevated WBC and low oxygen saturation at rest",
      diagnosis: "Community-acquired pneumonia (right lower lobe), acute hypoxemic respiratory failure. ICD-10: J18.9 + J96.01",
      prescription: ["Ibuprofen — 2 times a day", "Amoxicillin — 3 times a day", "meal: Take 1 hour before food"],
      notes: "Patient reported improvement in symptoms but still experiencing fatigue.",
    },
  },
  {
    id: "harris-reynolds",
    name: "Harris Reynolds",
    sex: "Male",
    age: 54,
    hue: 150,
    appointment: { dayOffset: 0, start: "11:30", end: "12:25", type: "Post-operation", location: "West camp, Room 312", tag: "Post-operation" },
    visit: {
      code: "PCI-HR12-QT4",
      symptoms: ["Fatigue", "Mild chest tightness"],
      lastChecked: "Dr. Reynolds on 29 Sep 2026",
      observation: "Access site healing well, no haematoma. BP 128/82, sinus rhythm.",
      diagnosis: "Status post PCI with drug-eluting stent to LAD. ICD-10: Z95.5",
      prescription: ["Aspirin 75 mg — once a day", "Clopidogrel 75 mg — once a day", "Atorvastatin 40 mg — at night"],
      notes: "Cleared for cardiac rehabilitation. Review dual antiplatelet therapy at 6 months.",
    },
  },
  {
    id: "elena-brooks",
    name: "Elena Brooks",
    sex: "Female",
    age: 47,
    hue: 330,
    appointment: { dayOffset: 0, start: "14:00", end: "14:30", type: "Follow-up appointment", location: "Room 210, Clinic Wing A" },
    visit: {
      code: "HTN-EB07-LM2",
      symptoms: ["Headache", "Dizziness"],
      lastChecked: "Dr. Reynolds on 14 Aug 2026",
      observation: "Home readings averaging 148/94 over two weeks.",
      diagnosis: "Essential hypertension, not at target. ICD-10: I10",
      prescription: ["Amlodipine 5 mg — once a day", "Ramipril 5 mg — once a day"],
      notes: "Discussed salt intake and sleep. Bring the home BP log to this visit.",
    },
  },
  {
    id: "laura-mitchell",
    name: "Laura Mitchell",
    sex: "Female",
    age: 33,
    hue: 12,
    appointment: { dayOffset: 1, start: "09:00", end: "09:30", type: "Consultation", location: "Room 305B, Clinic Wing B" },
    visit: {
      code: "ARR-LM33-PX1",
      symptoms: ["Palpitations", "Anxiety"],
      lastChecked: "Dr. Chen on 02 Jul 2026",
      observation: "Occasional premature atrial contractions on 24h Holter, no sustained arrhythmia.",
      diagnosis: "Benign atrial ectopy. ICD-10: I49.1",
      prescription: ["No medication", "Reduce caffeine intake"],
      notes: "Symptoms correlate with poor sleep. Reassured; return if episodes last longer than a few minutes.",
    },
  },
  {
    id: "david-ortiz",
    name: "David Ortiz",
    sex: "Male",
    age: 41,
    hue: 205,
    appointment: { dayOffset: 1, start: "10:15", end: "10:45", type: "Consultation", location: "Room 118, Clinic Wing A" },
    visit: {
      code: "LIP-DO41-RS8",
      symptoms: ["No symptoms"],
      lastChecked: "Dr. Patel on 21 May 2026",
      observation: "LDL 4.6 mmol/L, HDL 0.9 mmol/L. Family history of early coronary disease.",
      diagnosis: "Mixed dyslipidemia. ICD-10: E78.2",
      prescription: ["Rosuvastatin 10 mg — once a day"],
      notes: "Repeat lipid panel was requested before this visit.",
    },
  },
  {
    id: "marta-mayfield",
    name: "Marta Mayfield",
    sex: "Female",
    age: 62,
    hue: 265,
    appointment: { dayOffset: 1, start: "11:00", end: "11:30", type: "Follow-up appointment", location: "Room 210, Clinic Wing A" },
    visit: {
      code: "HF-MM62-TB5",
      symptoms: ["Shortness of breath", "Ankle swelling"],
      lastChecked: "Dr. Reynolds on 08 Sep 2026",
      observation: "Weight up 2 kg in a week, mild bibasal crackles. LVEF 38% on last echo.",
      diagnosis: "Heart failure with reduced ejection fraction, NYHA II. ICD-10: I50.2",
      prescription: ["Furosemide 40 mg — in the morning", "Bisoprolol 5 mg — once a day", "Sacubitril/valsartan — 2 times a day"],
      notes: "Asked to weigh daily and call if weight rises more than 1.5 kg in two days.",
    },
  },
  {
    id: "noah-bennett",
    name: "Noah Bennett",
    sex: "Male",
    age: 58,
    hue: 85,
    appointment: { dayOffset: 2, start: "09:30", end: "10:15", type: "Consultation", location: "Room 305B, Clinic Wing B", tag: "New Patient" },
    visit: {
      code: "CAD-NB58-WK3",
      symptoms: ["Exertional chest pain"],
      lastChecked: "Dr. Chen on 30 Sep 2026",
      observation: "Chest pain after two flights of stairs, relieved by rest. Resting ECG normal.",
      diagnosis: "Suspected stable angina, referred for assessment. ICD-10: I20.8",
      prescription: ["GTN spray — as needed", "Aspirin 75 mg — once a day"],
      notes: "Referred by primary care. Stress test to be arranged.",
    },
  },
  {
    id: "priya-nair",
    name: "Priya Nair",
    sex: "Female",
    age: 39,
    hue: 180,
    appointment: { dayOffset: 2, start: "14:00", end: "14:30", type: "Follow-up appointment", location: "Room 118, Clinic Wing A" },
    visit: {
      code: "SVT-PN39-HD6",
      symptoms: ["Palpitations"],
      lastChecked: "Dr. Reynolds on 11 Jun 2026",
      observation: "Two episodes of narrow-complex tachycardia captured on event monitor.",
      diagnosis: "Paroxysmal supraventricular tachycardia. ICD-10: I47.1",
      prescription: ["Metoprolol 25 mg — 2 times a day"],
      notes: "Taught vagal manoeuvres. Discuss ablation if episodes continue.",
    },
  },
];

const notifications: Notification[] = [
  { id: "n1", title: "Blood results ready", body: "Lab Center uploaded results for Harris Reynolds.", time: "12 min ago" },
  { id: "n2", title: "New patient assigned", body: "Thompson Carter was added to your list for today.", time: "1 h ago" },
  { id: "n3", title: "Schedule change", body: "Team daily planning moved to Conference Room A1.", time: "Yesterday" },
];

/**
 * Stats for a range. Patients registered (`added`) or deleted (`removed`) in
 * this session change the totals and the average appointment length in every
 * range, since today is part of the week and the month. Median age and PSS
 * need the full records, so they stay as they are until there is a database.
 */
export function getStats(range: Range, added: Patient[] = [], removed: Patient[] = []): Stat[] {
  if (added.length === 0 && removed.length === 0) return stats[range];

  const value = (id: string) => Number(stats[range].find((stat) => stat.id === id)!.value);
  const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  const length = (list: Patient[]) => list.reduce((sum, p) => sum + minutes(p.appointment.end) - minutes(p.appointment.start), 0);
  const total = value("total");
  const newTotal = total + added.length - removed.length;

  return stats[range].map((stat) => {
    if (stat.id === "total") return { ...stat, value: String(newTotal) };
    if (stat.id === "new") return { ...stat, value: String(Number(stat.value) + added.length) };
    if (stat.id === "time" && newTotal > 0) {
      return { ...stat, value: String(Math.round((value("time") * total + length(added) - length(removed)) / newTotal)) };
    }
    return stat;
  });
}

export function getDiagnoses(range: Range): Diagnosis[] {
  return diagnosisNames.map((d, i) => ({ ...d, pct: diagnosisShare[range][i] }));
}

export function getPatientFlow(range: Range): FlowPoint[] {
  return flow[range];
}

export function getPatients(): Patient[] {
  return patients;
}

export function getNotifications(): Notification[] {
  return notifications;
}

/**
 * Events for one day: patient appointments plus the recurring staff slots.
 * `dayOffset` is days from today, `weekday` is 0 (Sunday) to 6. `list` is the
 * current patient list, which can differ from the stored one after edits.
 */
export function getSchedule(dayOffset: number, weekday: number, list: Patient[] = patients): ScheduleEvent[] {
  const events: ScheduleEvent[] = list
    .filter((p) => p.appointment.dayOffset === dayOffset)
    .map((p) => ({
      id: `appt-${p.id}`,
      kind: "patient",
      title: `Patient ${p.name.split(" ")[0]}`,
      location: p.appointment.location,
      start: p.appointment.start,
      end: p.appointment.end,
      tag: p.appointment.tag,
      patientId: p.id,
    }));

  const isWeekend = weekday === 0 || weekday === 6;
  if (!isWeekend) {
    events.push({ id: "planning", kind: "meeting", title: "Team daily planning", location: "Conference Room A1", start: "08:30", end: "09:00" });
    if (weekday % 2 === 1) {
      events.push({ id: "lab", kind: "lab", title: "Blood Results Ready", location: "Lab Center, Floor 2", start: "13:00", end: "13:30" });
    } else {
      events.push({ id: "surgery", kind: "surgery", title: "Surgical Preparation", location: "OR Prep, Ward 3B", start: "15:30", end: "16:45" });
    }
  }

  return events.sort((a, b) => a.start.localeCompare(b.start));
}
