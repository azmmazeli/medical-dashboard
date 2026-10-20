import {
  Bookmark,
  CalendarDays,
  ChartPie,
  CircleDollarSign,
  File,
  LayoutDashboard,
  Library,
  LifeBuoy,
  LogOut,
  MessagesSquare,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown on the placeholder page until the section is built. */
  note?: string;
};

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "General",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/schedule", label: "Schedule", icon: CalendarDays, note: "A full calendar view of appointments and staff events." },
      { href: "/statistics", label: "Statistics & reports", icon: ChartPie, note: "Longer-range trends and exportable reports." },
      { href: "/patients", label: "Patients", icon: Users, note: "The complete patient directory and records." },
      { href: "/education", label: "Education", icon: Library, note: "Courses and reference material for the team." },
      { href: "/articles", label: "My articles", icon: Bookmark, note: "Articles you have saved or written." },
    ],
  },
  {
    title: "Tools",
    items: [
      { href: "/chat", label: "Chat & Calls", icon: MessagesSquare, note: "Messaging and calls with patients and colleagues." },
      { href: "/billings", label: "Billings", icon: CircleDollarSign, note: "Invoices, payments and insurance claims." },
      { href: "/documents", label: "Documents base", icon: File, note: "Shared forms, templates and protocols." },
    ],
  },
  {
    title: "Other",
    items: [
      { href: "/help", label: "Help", icon: LifeBuoy, note: "Guides and support contacts." },
      { href: "/settings", label: "Settings", icon: Settings, note: "Account and clinic preferences." },
      { href: "/logout", label: "Logout", icon: LogOut, note: "Signing out will work once authentication is added." },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);
