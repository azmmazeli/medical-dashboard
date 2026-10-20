import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { NAV_ITEMS } from "@/lib/nav";

// Sections with their own route folder are served from there, not from this placeholder.
const BUILT = ["/", "/schedule", "/patients"];

export function generateStaticParams() {
  return NAV_ITEMS.filter((item) => !BUILT.includes(item.href)).map((item) => ({ section: item.href.slice(1) }));
}

// Placeholder for the sidebar sections that are not built yet.
export default function SectionPage({ params }: PageProps<"/[section]">) {
  return (
    <Suspense>
      <Section params={params} />
    </Suspense>
  );
}

async function Section({ params }: Pick<PageProps<"/[section]">, "params">) {
  const { section } = await params;
  const item = NAV_ITEMS.find((nav) => nav.href === `/${section}`);
  if (!item) notFound();

  return (
    <div className="grid h-full min-h-[420px] place-items-center rounded-[28px] bg-card p-8 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-soft">
          <item.icon className="size-7" strokeWidth={1.75} />
        </span>
        <h1 className="mt-5 text-[26px] font-medium">{item.label}</h1>
        <p className="mt-2 text-muted">{item.note}</p>
        <p className="mt-1 text-muted">This page is not built yet.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-inverse px-5 py-2.5 text-inverse-fg">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
