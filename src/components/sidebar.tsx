"use client";

import { HeartPulse, PanelLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/lib/nav";
import { useApp } from "./app-shell";
import { cx } from "./ui";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed: collapsed, toggleSidebar, mobileNavOpen, setMobileNavOpen } = useApp();

  return (
    <>
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}
      <aside
        className={cx(
          "scroll-thin fixed inset-y-3 left-3 z-40 flex w-[240px] shrink-0 flex-col overflow-y-auto rounded-[28px] bg-card py-5 transition-[width,translate] duration-200 lg:static lg:translate-x-0",
          mobileNavOpen ? "translate-x-0 shadow-2xl" : "-translate-x-[120%]",
          collapsed && "lg:w-[84px]",
        )}
      >
        <div className={cx("flex items-center justify-between px-5", collapsed && "lg:flex-col lg:gap-4 lg:px-0")}>
          <Link href="/" aria-label="Dashboard home" className="grid size-14 place-items-center rounded-full bg-brand text-white">
            <HeartPulse className="size-7" />
          </Link>
          {/* Desktop: collapse to an icon rail. Mobile: close the drawer. */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            className="hidden size-10 place-items-center rounded-full text-muted hover:bg-soft hover:text-fg lg:grid"
          >
            <PanelLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
            className="grid size-10 place-items-center rounded-full text-muted hover:bg-soft hover:text-fg lg:hidden"
          >
            <PanelLeft className="size-6" />
          </button>
        </div>

        <nav aria-label="Main" className="mt-6 flex flex-col gap-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className={cx("px-7 pb-2 text-[13px] tracking-wide text-muted uppercase", collapsed && "lg:invisible")}>
                {group.title}
              </p>
              <ul>
                {group.items.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? item.label : undefined}
                        className={cx(
                          "flex items-center gap-3 border-l-2 py-3 pr-4 pl-[26px] text-[17px] transition-colors",
                          active ? "border-fg text-fg" : "border-transparent text-muted hover:text-fg",
                        )}
                      >
                        <item.icon className="size-6 shrink-0" strokeWidth={1.75} />
                        <span className={cx("truncate", collapsed && "lg:hidden")}>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
