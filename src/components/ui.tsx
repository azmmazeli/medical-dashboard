"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx("rounded-[28px] bg-card", className)}>{children}</section>;
}

/** Shared look for the labels and inputs inside a Dialog form. */
export const labelClass = "block text-[14px] text-muted";
export const fieldClass = "mt-1.5 w-full rounded-2xl border border-line bg-soft px-3.5 py-2.5 text-[15px] text-fg outline-none focus:border-fg";

/** Modal with a title and a close button. It opens when mounted, so render it conditionally. */
export function Dialog({ title, onClose, wide, children }: { title: string; onClose: () => void; wide?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className={cx(
        "scroll-thin m-auto rounded-[28px] bg-card p-7 text-fg backdrop:bg-black/40",
        wide ? "w-[min(600px,calc(100vw-24px))]" : "w-[min(440px,calc(100vw-24px))]",
      )}
    >
      <div className="flex items-center justify-between">
        <h2 id={titleId} className="text-[22px] font-medium">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-8 place-items-center rounded-full text-muted hover:bg-soft hover:text-fg"
        >
          <X className="size-5" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

/** A button with a floating panel that closes on outside click or Escape. */
export function Popover({
  button,
  children,
  align = "right",
  panelClassName,
}: {
  button: (state: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {button({ open, toggle: () => setOpen((value) => !value) })}
      {open && (
        <div
          className={cx(
            "absolute top-full z-30 mt-2 rounded-2xl border border-line bg-card p-1.5 shadow-xl shadow-black/10",
            align === "right" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/** Single-choice dropdown, styled as the quiet "By upcoming ⌄" text button. */
export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  const current = options.find((option) => option.value === value);
  return (
    <Popover
      panelClassName="min-w-40"
      button={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={label}
          className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[15px] text-muted hover:text-fg"
        >
          {current?.label}
          <ChevronDown className={cx("size-4 transition-transform", open && "rotate-180")} />
        </button>
      )}
    >
      {(close) => (
        <ul role="listbox" aria-label={label}>
          {options.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value);
                  close();
                }}
                className="flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2 text-left text-sm whitespace-nowrap hover:bg-soft"
              >
                {option.label}
                {option.value === value && <Check className="size-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Popover>
  );
}

export function Avatar({ name, hue, className }: { name: string; hue: number; className?: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <span
      aria-hidden
      className={cx("grid shrink-0 place-items-center rounded-full text-sm font-medium", className)}
      style={{ background: `hsl(${hue} 55% 84%)`, color: `hsl(${hue} 45% 24%)` }}
    >
      {initials}
    </span>
  );
}
