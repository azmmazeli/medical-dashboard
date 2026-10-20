"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { getPatients, type CustomEvent, type Patient, type Range } from "@/lib/data";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

type AppState = {
  range: Range;
  setRange: (range: Range) => void;
  selectedPatientId: string;
  selectPatient: (id: string) => void;
  /** The patient list. Changes are kept in memory until there is a database. */
  patients: Patient[];
  /** Patients registered, and stored patients deleted, in this session. */
  addedPatients: Patient[];
  removedPatients: Patient[];
  addPatient: (patient: Patient) => void;
  updatePatient: (patient: Patient) => void;
  removePatient: (id: string) => void;
  /** Events added from the schedule. Kept in memory until there is a database. */
  customEvents: CustomEvent[];
  addCustomEvent: (event: CustomEvent) => void;
  updateCustomEvent: (event: CustomEvent) => void;
  removeCustomEvent: (id: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
};

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppShell");
  return value;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<Range>("today");
  const [selectedPatientId, selectPatient] = useState(() => getPatients()[0].id);
  const [patients, setPatients] = useState(getPatients);
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const value = useMemo<AppState>(() => {
    const stored = getPatients();
    return {
      range,
      setRange,
      selectedPatientId,
      selectPatient,
      patients,
      addedPatients: patients.filter((p) => !stored.some((s) => s.id === p.id)),
      removedPatients: stored.filter((s) => !patients.some((p) => p.id === s.id)),
      addPatient: (patient) => setPatients((list) => [...list, patient]),
      updatePatient: (patient) => setPatients((list) => list.map((old) => (old.id === patient.id ? patient : old))),
      removePatient: (id) => setPatients((list) => list.filter((patient) => patient.id !== id)),
      customEvents,
      addCustomEvent: (event) => setCustomEvents((events) => [...events, event]),
      updateCustomEvent: (event) => setCustomEvents((events) => events.map((old) => (old.id === event.id ? event : old))),
      removeCustomEvent: (id) => setCustomEvents((events) => events.filter((event) => event.id !== id)),
      sidebarCollapsed,
      toggleSidebar: () => setSidebarCollapsed((collapsed) => !collapsed),
      mobileNavOpen,
      setMobileNavOpen,
    };
  }, [range, selectedPatientId, patients, customEvents, sidebarCollapsed, mobileNavOpen]);

  return (
    <AppContext.Provider value={value}>
      <div className="flex h-dvh gap-3 p-3">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Topbar />
          <main className="scroll-thin min-h-0 flex-1 overflow-y-auto rounded-[28px]">{children}</main>
        </div>
      </div>
    </AppContext.Provider>
  );
}
