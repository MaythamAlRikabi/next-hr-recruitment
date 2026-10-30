"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import type { MenuGroup } from "@/components/layout/MegaMenu";

type Item = { href: string; label: string };

/** Mobile navigation drawer: large touch targets, closes on selection or Escape. */
export function MobileMenu({
  groups,
  soon,
  items,
  quick,
  quickLabel,
  signIn,
  register,
  menuLabel,
  closeLabel,
}: {
  groups: MenuGroup[];
  soon: string;
  items: Item[];
  quick: Item[];
  quickLabel: string;
  signIn: Item;
  register: Item;
  menuLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? closeLabel : menuLabel}
        onClick={() => setOpen((v) => !v)}
        className="grid size-11 place-items-center rounded-xl border border-line bg-white text-midnight transition hover:border-brand hover:text-brand"
      >
        {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
      </button>

      {open ? (
        <>
          <nav
            id={id}
            aria-label="Mobile"
            className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-64px)] overflow-y-auto border-b border-line bg-white px-4 pb-5 pt-2 shadow-lift"
          >
            <ul aria-label={quickLabel} className="grid grid-cols-3 gap-2 pb-3 pt-1">
              {quick.map((q, i) => (
                <li key={q.href}>
                  <Link
                    href={q.href}
                    onClick={close}
                    className={`grid min-h-12 place-items-center rounded-xl px-2 text-center text-sm font-bold ${i === 0 ? "bg-brand text-white hover:bg-brand-hover" : "border border-line text-midnight hover:border-brand hover:text-brand"}`}
                  >
                    {q.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="divide-y divide-line border-t border-line">
              {groups.map((g) => (
                <details key={g.key} className="group">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-base font-semibold text-midnight [&::-webkit-details-marker]:hidden">
                    {g.title}
                    <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden />
                  </summary>
                  <ul className="pb-3 ps-3">
                    {g.items.map((it) => (
                      <li key={it.label}>
                        {it.soon || !it.href ? (
                          <span aria-disabled="true" className="flex min-h-11 items-center justify-between gap-3 text-sm font-semibold text-muted">
                            {it.label}
                            <span className="rounded-full bg-line/70 px-2 py-0.5 text-[11px]">{soon}</span>
                          </span>
                        ) : (
                          <Link href={it.href} onClick={close} className="flex min-h-11 items-center text-sm font-semibold text-midnight hover:text-brand">
                            {it.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
              <ul>
                {items.map((it) => (
                  <li key={it.href} className="border-b border-line last:border-0">
                    <Link href={it.href} onClick={close} className="flex min-h-12 items-center text-base font-semibold text-midnight hover:text-brand">
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href={signIn.href} onClick={close} className="grid min-h-12 place-items-center rounded-xl border border-line font-semibold text-midnight hover:border-brand hover:text-brand">
                {signIn.label}
              </Link>
              <Link href={register.href} onClick={close} className="grid min-h-12 place-items-center rounded-xl bg-brand font-semibold text-white hover:bg-brand-hover">
                {register.label}
              </Link>
            </div>
          </nav>
        </>
      ) : null}
    </div>
  );
}
