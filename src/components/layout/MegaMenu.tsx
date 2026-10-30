"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type MenuItem = { href: string; label: string; hint?: string; soon?: boolean };
export type MenuGroup = { key: string; title: string; items: MenuItem[] };

/**
 * Desktop mega menu. Disclosure pattern: each group is a button (aria-expanded) that opens a panel of links.
 * Opens on click, hover or keyboard; closes on Escape, outside click or focus leaving the menu.
 * Items without a live feature are rendered as disabled text with a "not available yet" badge — never as a dead link.
 */
export function MegaMenu({ groups, links, soon }: { groups: MenuGroup[]; links: { href: string; label: string }[]; soon: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const base = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onDown = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(null); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [open]);

  return (
    <nav
      ref={root}
      className="ms-4 hidden flex-1 items-center gap-0.5 xl:flex"
      aria-label="Primary"
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(null); }}
    >
      {groups.map((g) => {
        const isOpen = open === g.key;
        const panelId = `${base}-${g.key}`;
        return (
          <div key={g.key} className="relative" onMouseEnter={() => setOpen(g.key)} onMouseLeave={() => setOpen((v) => (v === g.key ? null : v))}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : g.key)}
              className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold transition hover:bg-brand-soft hover:text-brand ${isOpen ? "bg-brand-soft text-brand" : "text-midnight"}`}
            >
              {g.title}
              <ChevronDown className={`size-3.5 transition ${isOpen ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {isOpen ? (
              <div id={panelId} className="absolute start-0 top-full z-50 w-80 pt-2">
                <ul className="rounded-2xl border border-line bg-white p-2 shadow-float">
                  {g.items.map((it) => (
                    <li key={it.label}>
                      {it.soon || !it.href ? (
                        <span aria-disabled="true" className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted">
                          {it.label}
                          <span className="rounded-full bg-line/70 px-2 py-0.5 text-[11px] font-semibold text-muted">{soon}</span>
                        </span>
                      ) : (
                        <Link href={it.href} onClick={() => setOpen(null)} className="block rounded-xl px-3 py-2.5 transition hover:bg-brand-soft">
                          <span className="block text-sm font-bold text-midnight">{it.label}</span>
                          {it.hint ? <span className="mt-0.5 block text-xs leading-snug text-muted">{it.hint}</span> : null}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        );
      })}
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold text-midnight transition hover:bg-brand-soft hover:text-brand">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
