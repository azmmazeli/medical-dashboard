"use client";

import { Bell, ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu, Moon, Search, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { doctor, getNotifications, type Range } from "@/lib/data";
import { NAV_ITEMS } from "@/lib/nav";
import { useTheme } from "@/lib/theme";
import { useApp } from "./app-shell";
import { Avatar, Popover, cx } from "./ui";

const RANGES: { value: Range; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const iconButton = "grid size-11 shrink-0 place-items-center rounded-full text-fg hover:bg-soft-hover";

export function Topbar() {
  const router = useRouter();
  const { range, setRange, setMobileNavOpen } = useApp();
  const { theme, toggle } = useTheme();

  return (
    <header className="flex flex-wrap items-center gap-2 rounded-[28px] bg-card p-2">
      <button type="button" onClick={() => setMobileNavOpen(true)} aria-label="Open menu" className={cx(iconButton, "lg:hidden")}>
        <Menu className="size-6" />
      </button>

      <div className="hidden items-center rounded-full bg-soft sm:flex">
        <button type="button" onClick={() => router.back()} aria-label="Go back" className={iconButton}>
          <ChevronLeft className="size-6" />
        </button>
        <button type="button" onClick={() => router.forward()} aria-label="Go forward" className={cx(iconButton, "text-muted")}>
          <ChevronRight className="size-6" />
        </button>
      </div>

      <GlobalSearch />

      <div role="group" aria-label="Time range" className="order-last flex w-full items-center rounded-full bg-soft p-1.5 md:order-none md:w-auto">
        {RANGES.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={range === option.value}
            onClick={() => setRange(option.value)}
            className={cx(
              "h-9 flex-1 rounded-full px-5 text-[15px] transition-colors md:flex-none",
              range === option.value ? "bg-inverse text-inverse-fg" : "text-muted hover:text-fg",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Popover
        panelClassName="w-56"
        button={({ open, toggle: toggleMenu }) => (
          <button
            type="button"
            onClick={toggleMenu}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="Account menu"
            className="flex h-12 items-center gap-3 rounded-full bg-soft py-1 pr-1.5 pl-1.5 text-left hover:bg-soft-hover xl:pr-4"
          >
            <Avatar name="Michael Reynolds" hue={150} className="size-9" />
            <span className="hidden leading-tight xl:block">
              <span className="block text-[15px] font-medium">{doctor.name}</span>
              <span className="block text-[13px] text-muted">{doctor.role}</span>
            </span>
            <ChevronDown className={cx("hidden size-5 text-muted transition-transform xl:block", open && "rotate-180")} />
          </button>
        )}
      >
        {(close) => (
          <div role="menu">
            <div className="px-3 py-2 xl:hidden">
              <p className="text-sm font-medium">{doctor.name}</p>
              <p className="text-xs text-muted">{doctor.role}</p>
            </div>
            <Link href="/settings" role="menuitem" onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-soft">
              <Settings className="size-4" /> Settings
            </Link>
            <Link href="/logout" role="menuitem" onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-soft">
              <LogOut className="size-4" /> Logout
            </Link>
          </div>
        )}
      </Popover>

      <button
        type="button"
        onClick={toggle}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className={cx(iconButton, "size-12 bg-soft")}
      >
        {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </button>

      <Notifications />
    </header>
  );
}

function GlobalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const { patients: allPatients, selectPatient } = useApp();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const q = query.trim().toLowerCase();
  const patients = q
    ? allPatients.filter((p) => [p.name, p.appointment.type, p.visit.diagnosis, p.visit.code].some((text) => text.toLowerCase().includes(q)))
    : [];
  const pages = q ? NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(q)) : [];
  const open = focused && q.length > 0;

  const openPatient = (id: string) => {
    selectPatient(id);
    setQuery("");
    if (pathname !== "/") router.push("/");
  };

  return (
    <div className="relative min-w-24 flex-1">
      <label className="flex h-12 items-center gap-3 rounded-full border border-line px-4 focus-within:border-fg">
        <Search className="size-5 shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setQuery("");
            if (event.key === "Enter" && patients[0]) openPatient(patients[0].id);
          }}
          placeholder="Search"
          aria-label="Search patients and pages"
          className="w-full min-w-0 bg-transparent text-[16px] outline-none placeholder:text-muted"
        />
      </label>

      {open && (
        // preventDefault on mousedown keeps focus in the input so the click lands.
        <div
          onMouseDown={(event) => event.preventDefault()}
          className="absolute inset-x-0 top-full z-30 mt-2 rounded-2xl border border-line bg-card p-1.5 shadow-xl shadow-black/10"
        >
          {patients.length === 0 && pages.length === 0 && <p className="px-3 py-3 text-sm text-muted">Nothing matches “{query.trim()}”.</p>}
          {patients.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() => openPatient(patient.id)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-soft"
            >
              <Avatar name={patient.name} hue={patient.hue} className="size-8 text-xs" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{patient.name}</span>
                <span className="block truncate text-xs text-muted">{patient.appointment.type}</span>
              </span>
              <span className="text-xs text-muted">{patient.visit.code}</span>
            </button>
          ))}
          {pages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              onClick={() => setQuery("")}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-soft"
            >
              <page.icon className="size-4 text-muted" /> {page.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const items = getNotifications();
  const [read, setRead] = useState<string[]>([]);
  const unread = items.filter((item) => !read.includes(item.id)).length;

  return (
    <Popover
      panelClassName="w-80 max-w-[calc(100vw-2rem)]"
      button={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          className={cx(iconButton, "relative size-12 bg-soft")}
        >
          <Bell className="size-5" />
          {unread > 0 && <span className="absolute top-3 right-3 size-2.5 rounded-full bg-bad ring-2 ring-soft" />}
        </button>
      )}
    >
      {() => (
        <div>
          <div className="flex items-center justify-between px-3 py-2">
            <p className="font-medium">Notifications</p>
            <button
              type="button"
              disabled={unread === 0}
              onClick={() => setRead(items.map((item) => item.id))}
              className="text-xs text-muted hover:text-fg disabled:opacity-50"
            >
              Mark all as read
            </button>
          </div>
          <ul>
            {items.map((item) => {
              const isRead = read.includes(item.id);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setRead((ids) => (ids.includes(item.id) ? ids : [...ids, item.id]))}
                    className="flex w-full gap-3 rounded-xl px-3 py-2 text-left hover:bg-soft"
                  >
                    <span className={cx("mt-1.5 size-2 shrink-0 rounded-full", isRead ? "bg-transparent" : "bg-bad")} />
                    <span className={cx("min-w-0", isRead && "text-muted")}>
                      <span className="block text-sm font-medium">{item.title}</span>
                      <span className="block text-xs text-muted">{item.body}</span>
                      <span className="mt-0.5 block text-xs text-muted">{item.time}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Popover>
  );
}
