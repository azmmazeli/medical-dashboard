"use client";

import type { ReactNode } from "react";
import { useApp } from "../app-shell";
import { Card } from "../ui";

export function VisitDetails() {
  const { patients, selectedPatientId } = useApp();
  const patient = patients.find((p) => p.id === selectedPatientId);

  if (!patient) {
    return (
      <Card className="p-7">
        <h2 className="text-[22px] font-medium">Last visit details</h2>
        <p className="mt-4 text-muted">Select a patient to see their last visit.</p>
      </Card>
    );
  }

  const { visit } = patient;

  return (
    <Card className="p-7">
      <h2 className="text-[22px] font-medium">Last visit details</h2>

      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-4">
        <p className="text-[20px] font-medium">{patient.name}</p>
        <p className="text-[16px] text-muted">{visit.code}</p>
      </div>
      <p className="mt-1 text-[16px] text-muted">
        {patient.sex}, {patient.age} years
      </p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {visit.symptoms.map((symptom) => (
          <li key={symptom} className="rounded-full bg-soft px-3 py-1 text-[14px] font-medium">
            {symptom}
          </li>
        ))}
      </ul>

      <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-1 text-[16px] sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-y-4">
        <Row term="Last Checked">{visit.lastChecked}</Row>
        <Row term="Observation">{visit.observation}</Row>
        <Row term="Diagnosis">{visit.diagnosis}</Row>
        <Row term="Prescription">
          {visit.prescription.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </Row>
        <Row term="Notes">{visit.notes}</Row>
      </dl>
    </Card>
  );
}

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted">{term}</dt>
      <dd className="mb-3 font-medium sm:mb-0">{children}</dd>
    </>
  );
}
