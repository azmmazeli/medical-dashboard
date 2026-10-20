"use client";

import { CalendarDays, ChevronLeft, ChevronRight, HeartPulse, Microscope, Pencil, Plus, UserRound, Users, X, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { getSchedule, type CustomEvent, type EventKind, type ScheduleEvent } from "@/lib/data";
import { addDays, formatMinutes, fromDateKey, startOfDay, startOfWeek, toDateKey, toMinutes } from "@/lib/time";
import { useApp } from "../app-shell";
import { Card, Dialog, Popover, Select, cx, fieldClass, labelClass } from "../ui";

const PX_PER_MIN = 3;
const TOP_PAD = 16;
const DAY_MS = 86_400_000;

type Filter = "all" | EventKind;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "patient", label: "Patients" },
  { value: "meeting", label: "Meetings" },
  { value: "lab", label: "Lab" },
  { value: "surgery", label: "Surgery" },
];

const KINDS: { value: EventKind; label: string }[] = [
  { value: "patient", label: "Patient" },
  { value: "meeting", label: "Meeting" },
  { value: "lab", label: "Lab" },
  { value: "surgery", label: "Surgery" },
];

const ICONS: Record<EventKind, LucideIcon> = {
  patient: UserRound,
  meeting: Users,
  lab: Microscope,
  surgery: HeartPulse,
};

export function SchedulePanel({ now, className }: { now: Date | null; className?: string }) {
  // Both are offsets from today so no Date has to exist during server render.
  const [weekOffset, setWeekOffset] = useState(0);
  const [dayOffset, setDayOffset] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  // The event open in the dialog: "new" for a blank form, or one being edited.
  const [editing, setEditing] = useState<CustomEvent | "new" | null>(null);
  const { patients, customEvents, addCustomEvent, updateCustomEvent, removeCustomEvent } = useApp();

  if (!now) {
    return <Card className={cx("min-h-[480px] animate-pulse", className)}>{null}</Card>;
  }

  const today = startOfDay(now);
  const weekStart = addDays(startOfWeek(today), weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const selected = addDays(today, dayOffset);
  const offsetOf = (date: Date) => Math.round((date.getTime() - today.getTime()) / DAY_MS);

  const selectedKey = toDateKey(selected);
  const events = [...getSchedule(dayOffset, selected.getDay(), patients), ...customEvents.filter((event) => event.date === selectedKey)]
    .filter((event) => filter === "all" || event.kind === filter)
    .sort((a, b) => a.start.localeCompare(b.start));
  // "12 Oct 2026"
  const heading = selected.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const goToToday = () => {
    setWeekOffset(0);
    setDayOffset(0);
  };

  // The heading shows the selected day, so the selection moves with the week strip.
  const shiftWeek = (weeks: number) => {
    setWeekOffset((w) => w + weeks);
    setDayOffset((d) => d + weeks * 7);
  };

  // Select a day and bring its week into the strip.
  const goToDate = (date: Date) => {
    setDayOffset(offsetOf(date));
    setWeekOffset(Math.round((startOfWeek(date).getTime() - startOfWeek(today).getTime()) / (7 * DAY_MS)));
  };

  return (
    // No overflow-hidden here: the calendar and filter popovers may extend past the card.
    <Card className={cx("flex flex-col", className)}>
      <div className="@container px-7 pt-7 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Popover
              align="left"
              panelClassName="w-[292px] p-3"
              button={({ open, toggle }) => (
                <button
                  type="button"
                  onClick={toggle}
                  aria-haspopup="dialog"
                  aria-expanded={open}
                  aria-label="Choose date"
                  title="Choose date"
                  className={cx("grid size-9 shrink-0 place-items-center rounded-full hover:bg-soft-hover", open ? "bg-soft-hover" : "bg-soft")}
                >
                  <CalendarDays className="size-5" />
                </button>
              )}
            >
              {(close) => (
                <DatePicker
                  today={today}
                  selected={selected}
                  onSelect={(date) => {
                    goToDate(date);
                    close();
                  }}
                />
              )}
            </Popover>
            <h2 className="truncate text-[22px] font-medium">{heading}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {(weekOffset !== 0 || dayOffset !== 0) && (
              // In the narrow dashboard column there is no room; the date picker has its own Today.
              <button type="button" onClick={goToToday} className="mr-1 hidden rounded-full bg-soft px-3 py-1 text-[14px] hover:bg-soft-hover @md:block">
                Today
              </button>
            )}
            <button
              type="button"
              onClick={() => shiftWeek(-1)}
              aria-label="Previous week"
              className="grid size-8 place-items-center rounded-full text-muted hover:bg-soft hover:text-fg"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => shiftWeek(1)}
              aria-label="Next week"
              className="grid size-8 place-items-center rounded-full hover:bg-soft"
            >
              <ChevronRight className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setEditing("new")}
              aria-label="Add event"
              title="Add event"
              className="ml-1 grid size-8 place-items-center rounded-full bg-inverse text-inverse-fg"
            >
              <Plus className="size-5" />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 text-center">
          {days.map((day) => {
            const offset = offsetOf(day);
            const isSelected = offset === dayOffset;
            return (
              <div key={offset} className="flex flex-col items-center gap-3">
                <span className="text-[16px] text-muted">{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
                <button
                  type="button"
                  onClick={() => setDayOffset(offset)}
                  aria-pressed={isSelected}
                  aria-label={day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  className={cx(
                    "grid size-10 place-items-center rounded-full text-[16px] font-medium transition-colors",
                    isSelected ? "bg-inverse text-inverse-fg" : "hover:bg-soft",
                    !isSelected && offset === 0 && "ring-1 ring-fg",
                  )}
                >
                  {day.getDate()}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line px-7 pt-4 pb-2">
        <p className="text-[15px] text-muted">
          {events.length} {events.length === 1 ? "event" : "events"}
        </p>
        <Select value={filter} options={FILTERS} onChange={setFilter} label="Filter events" />
      </div>

      {events.length === 0 ? (
        <p className="px-7 py-10 text-center text-muted">
          {filter === "all" ? "Nothing scheduled for this day." : "No events of this type on this day."}
        </p>
      ) : (
        <Timeline
          key={dayOffset}
          events={events}
          nowMinutes={dayOffset === 0 ? now.getHours() * 60 + now.getMinutes() : null}
          onEdit={(id) => setEditing(customEvents.find((event) => event.id === id) ?? null)}
          onRemove={removeCustomEvent}
        />
      )}

      {editing && (
        <EventDialog
          event={editing === "new" ? undefined : editing}
          defaultDate={selectedKey}
          onClose={() => setEditing(null)}
          onSave={(event) => {
            if (editing === "new") addCustomEvent(event);
            else updateCustomEvent(event);
            // Show the saved event even if it would be hidden by the current filter.
            if (filter !== "all" && filter !== event.kind) setFilter("all");
            goToDate(fromDateKey(event.date));
          }}
        />
      )}
    </Card>
  );
}

const MONTHS = Array.from({ length: 12 }, (_, month) => new Date(2000, month, 1).toLocaleDateString("en-US", { month: "long" }));
const YEAR_SPAN = 10;

/** Month grid with month and year dropdowns. */
function DatePicker({ today, selected, onSelect }: { today: Date; selected: Date; onSelect: (date: Date) => void }) {
  const [view, setView] = useState({ year: selected.getFullYear(), month: selected.getMonth() });

  const moveMonth = (delta: number) => {
    const next = new Date(view.year, view.month + delta, 1);
    setView({ year: next.getFullYear(), month: next.getMonth() });
  };

  // Always six weeks, starting on the Monday on or before the 1st.
  const gridStart = startOfWeek(new Date(view.year, view.month, 1));
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const firstYear = Math.min(today.getFullYear() - YEAR_SPAN, view.year);
  const lastYear = Math.max(today.getFullYear() + YEAR_SPAN, view.year);
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i);
  const selectClass = "rounded-full bg-soft px-2 py-1 text-[14px] hover:bg-soft-hover";

  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => moveMonth(-1)}
          aria-label="Previous month"
          className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-soft"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex flex-1 justify-center gap-1">
          <select
            aria-label="Month"
            value={view.month}
            onChange={(e) => setView({ ...view, month: Number(e.target.value) })}
            className={selectClass}
          >
            {MONTHS.map((name, month) => (
              <option key={name} value={month}>
                {name}
              </option>
            ))}
          </select>
          <select
            aria-label="Year"
            value={view.year}
            onChange={(e) => setView({ ...view, year: Number(e.target.value) })}
            className={selectClass}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => moveMonth(1)}
          aria-label="Next month"
          className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-soft"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center">
        {cells.slice(0, 7).map((day) => (
          <span key={day.getDay()} className="pb-1 text-[13px] text-muted">
            {day.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)}
          </span>
        ))}
        {cells.map((day) => {
          const isSelected = day.getTime() === selected.getTime();
          const isToday = day.getTime() === today.getTime();
          return (
            <button
              key={day.getTime()}
              type="button"
              onClick={() => onSelect(day)}
              aria-pressed={isSelected}
              aria-label={day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              className={cx(
                "mx-auto grid size-9 place-items-center rounded-full text-[14px] tabular-nums transition-colors",
                isSelected ? "bg-inverse text-inverse-fg" : "hover:bg-soft",
                !isSelected && isToday && "ring-1 ring-fg",
                !isSelected && day.getMonth() !== view.month && "text-muted",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <button type="button" onClick={() => onSelect(today)} className="mt-2 w-full rounded-full bg-soft py-1.5 text-[14px] hover:bg-soft-hover">
        Today
      </button>
    </div>
  );
}

/** Form for a new event, or for editing `event` when one is given. */
function EventDialog({
  event,
  defaultDate,
  onClose,
  onSave,
}: {
  event?: CustomEvent;
  defaultDate: string;
  onClose: () => void;
  onSave: (event: CustomEvent) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    const start = text("start");
    const end = text("end");
    if (toMinutes(end) <= toMinutes(start)) {
      setError("End time must be after the start time.");
      return;
    }
    onSave({
      id: event?.id ?? `custom-${crypto.randomUUID()}`,
      kind: text("kind") as EventKind,
      title: text("title"),
      location: text("location"),
      date: text("date"),
      start,
      end,
      custom: true,
    });
    onClose();
  };

  return (
    <Dialog title={event ? "Edit event" : "Add event"} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <label className={cx(labelClass, "col-span-2")}>
            Title
            <input name="title" required maxLength={60} autoFocus defaultValue={event?.title} placeholder="e.g. Cardiology review" className={fieldClass} />
          </label>
          <label className={labelClass}>
            Type
            <select name="kind" defaultValue={event?.kind ?? "meeting"} className={fieldClass}>
              {KINDS.map((kind) => (
                <option key={kind.value} value={kind.value}>
                  {kind.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Date
            <input name="date" type="date" required defaultValue={event?.date ?? defaultDate} className={fieldClass} />
          </label>
          <label className={labelClass}>
            Starts
            <input name="start" type="time" required defaultValue={event?.start ?? "10:00"} onChange={() => setError(null)} className={fieldClass} />
          </label>
          <label className={labelClass}>
            Ends
            <input name="end" type="time" required defaultValue={event?.end ?? "10:30"} onChange={() => setError(null)} className={fieldClass} />
          </label>
          <label className={cx(labelClass, "col-span-2")}>
            Location
            <input name="location" maxLength={60} defaultValue={event?.location} placeholder="e.g. Room 210, Clinic Wing A" className={fieldClass} />
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
            {event ? "Save changes" : "Add event"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

/**
 * Side-by-side lanes for events whose times overlap. Expects events sorted by
 * start; returns each event's lane and how many lanes its group needs.
 */
function layoutLanes(events: ScheduleEvent[]) {
  const layout = new Map<string, { lane: number; lanes: number }>();
  let group: ScheduleEvent[] = [];
  let laneEnds: number[] = [];
  let groupEnd = -1;

  const closeGroup = () => {
    for (const event of group) layout.get(event.id)!.lanes = laneEnds.length;
    group = [];
    laneEnds = [];
  };

  for (const event of events) {
    const start = toMinutes(event.start);
    const end = toMinutes(event.end);
    if (start >= groupEnd) closeGroup();
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = end;
    groupEnd = Math.max(groupEnd, end);
    group.push(event);
    layout.set(event.id, { lane, lanes: 1 });
  }
  closeGroup();
  return layout;
}

function Timeline({
  events,
  nowMinutes,
  onEdit,
  onRemove,
}: {
  events: ScheduleEvent[];
  nowMinutes: number | null;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { selectedPatientId, selectPatient } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const startHour = Math.floor(Math.min(...events.map((e) => toMinutes(e.start))) / 60);
  const endHour = Math.ceil(Math.max(...events.map((e) => toMinutes(e.end))) / 60);
  const startMin = startHour * 60;
  const endMin = endHour * 60;
  const top = (minutes: number) => TOP_PAD + (minutes - startMin) * PX_PER_MIN;
  const showNow = nowMinutes !== null && nowMinutes >= startMin && nowMinutes <= endMin;
  const lanes = layoutLanes(events);

  // On mount (the timeline is keyed by day), bring the current time into view.
  useEffect(() => {
    if (showNow && scrollRef.current) scrollRef.current.scrollTop = Math.max(0, top(nowMinutes) - 120);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount, not every minute
  }, []);

  return (
    <div ref={scrollRef} className="scroll-thin max-h-[640px] min-h-0 flex-1 overflow-y-auto rounded-b-[28px] xl:max-h-none">
      <div className="relative" style={{ height: top(endMin) + TOP_PAD }}>
        <div className="absolute top-0 bottom-0 left-[58px] w-px bg-line" />
        {Array.from({ length: endHour - startHour + 1 }, (_, i) => (
          <span
            key={i}
            className="absolute left-0 w-[116px] -translate-y-1/2 text-center text-[15px] text-muted"
            style={{ top: top(startMin + i * 60) }}
          >
            <span className="bg-card px-1 py-1.5">{formatMinutes(startMin + i * 60)}</span>
          </span>
        ))}

        {events.map((event) => {
          const start = toMinutes(event.start);
          const end = toMinutes(event.end);
          const Icon = ICONS[event.kind];
          const selected = event.patientId !== undefined && event.patientId === selectedPatientId;
          const body = (
            <>
              <span className={cx("grid size-11 shrink-0 place-items-center rounded-full", selected ? "bg-inverse text-inverse-fg" : "bg-card")}>
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                {event.tag && (
                  <span
                    className={cx(
                      "mb-1.5 inline-block rounded-full px-2.5 py-0.5 text-[13px] font-medium",
                      event.tag === "Post-operation" ? "bg-tag-soft text-tag" : "bg-card",
                    )}
                  >
                    {event.tag}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[16px] font-medium">
                  <span className="truncate">{event.title}</span>
                  {event.patientId && <ChevronRight className="size-4 shrink-0" />}
                </span>
                <span className="block truncate text-[14px] text-muted">{event.location}</span>
                <span className="block text-[14px] text-muted tabular-nums">
                  {event.start} — {event.end}
                </span>
              </span>
            </>
          );
          const boxClass = cx(
            "absolute flex gap-3 overflow-hidden rounded-[24px] border bg-soft px-3 py-2.5 text-left",
            selected ? "border-fg" : "border-transparent",
          );
          // The event column runs from 108px to 24px short of the right edge.
          const { lane, lanes: laneCount } = lanes.get(event.id)!;
          const style = {
            top: top(start),
            height: (end - start) * PX_PER_MIN - 8,
            left: `calc(108px + (100% - 132px) * ${lane / laneCount})`,
            width: `calc((100% - 132px) / ${laneCount} - ${laneCount > 1 ? 4 : 0}px)`,
          };

          return event.patientId ? (
            <button key={event.id} type="button" onClick={() => selectPatient(event.patientId!)} className={cx(boxClass, "hover:bg-soft-hover")} style={style}>
              {body}
            </button>
          ) : (
            <div key={event.id} className={boxClass} style={style}>
              {body}
              {event.custom && (
                <span className="absolute top-2 right-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(event.id)}
                    aria-label={`Edit ${event.title}`}
                    title="Edit"
                    className="grid size-7 place-items-center rounded-full bg-card text-muted hover:text-fg"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(event.id)}
                    aria-label={`Remove ${event.title}`}
                    title="Remove"
                    className="grid size-7 place-items-center rounded-full bg-card text-muted hover:text-fg"
                  >
                    <X className="size-4" />
                  </button>
                </span>
              )}
            </div>
          );
        })}

        {showNow && (
          <div className="pointer-events-none absolute inset-x-0 z-10 flex -translate-y-1/2 items-center" style={{ top: top(nowMinutes) }}>
            <span className="ml-[30px] rounded-full bg-inverse px-2 py-0.5 text-[13px] text-inverse-fg tabular-nums">{formatMinutes(nowMinutes)}</span>
            <span className="h-px flex-1 bg-fg" />
          </div>
        )}
      </div>
    </div>
  );
}
