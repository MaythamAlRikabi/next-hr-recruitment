"use client";

import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type MenuItem = { href: string; label: string; hint?: string; soon?: boolean };
export type MenuGroup = { key: string; title: string; items: MenuItem[] };

/**
 * Desktop mega menu (disclosure pattern). Each group is a button (aria-expanded) controlling a panel of links.
 * - Mouse: opens on hover (mouse pointers only, so a touch tap is not "hover then toggle-closed"), click also toggles.
 * - Touch: tap toggles.
 * - Keyboard: Enter/Space/ArrowDown opens and focuses the first item; ArrowUp/Down/Home/End move inside the panel;
 *   ArrowLeft/Right move between groups (direction-aware for RTL); Escape closes and returns focus to the trigger; Tab leaves.
 * - The panel is measured after opening and shifted so it never extends past the viewport edge (either direction).
 * Items without a live feature are shown as disabled text with a "not available yet" badge, never as a dead link.
 */
export function MegaMenu({ groups, links, soon }: { groups: MenuGroup[]; links: { href: string; label: string }[]; soon: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const byHover = useRef(false); // true while the open panel was opened by mouse hover and not yet clicked
  const base = useId();

  const triggers = () => Array.from(root.current?.querySelectorAll<HTMLButtonElement>("button[data-trigger]") ?? []);
  const panelLinks = () => Array.from(panel.current?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []);
  const cancelClose = () => { if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; } };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const key = open;
      setOpen(null);
      root.current?.querySelector<HTMLButtonElement>(`button[data-trigger="${key}"]`)?.focus();
    };
    const onDown = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(null); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, [open]);

  // Keep the panel inside the viewport (16px margin) whatever the language direction.
  useLayoutEffect(() => {
    const el = panel.current;
    if (!open || !el) return;
    el.style.transform = "";
    const r = el.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    if (r.right > vw - 16) el.style.transform = `translateX(${vw - 16 - r.right}px)`;
    else if (r.left < 16) el.style.transform = `translateX(${16 - r.left}px)`;
  }, [open]);

  useEffect(() => () => cancelClose(), []);

  const rtl = () => (root.current ? getComputedStyle(root.current).direction === "rtl" : false);

  const onTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>, key: string, idx: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(key);
      requestAnimationFrame(() => { const l = panelLinks(); (e.key === "ArrowDown" ? l[0] : l[l.length - 1])?.focus(); });
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const forward = (e.key === "ArrowRight") !== rtl();
      const t = triggers();
      const next = t[(idx + (forward ? 1 : -1) + t.length) % t.length];
      next?.focus();
      if (open) setOpen(next?.dataset.trigger ?? null);
    }
  };

  const onPanelKey = (e: React.KeyboardEvent, key: string) => {
    const l = panelLinks();
    const i = l.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === "ArrowDown") { e.preventDefault(); l[(i + 1) % l.length]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); l[(i - 1 + l.length) % l.length]?.focus(); }
    else if (e.key === "Home") { e.preventDefault(); l[0]?.focus(); }
    else if (e.key === "End") { e.preventDefault(); l[l.length - 1]?.focus(); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const t = triggers();
      const idx = t.findIndex((b) => b.dataset.trigger === key);
      const forward = (e.key === "ArrowRight") !== rtl();
      const next = t[(idx + (forward ? 1 : -1) + t.length) % t.length];
      next?.focus();
      setOpen(next?.dataset.trigger ?? null);
    }
  };

  return (
    <nav
      ref={root}
      className="ms-3 hidden min-w-0 flex-1 items-center gap-0.5 xl:flex"
      aria-label="Primary"
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(null); }}
    >
      {groups.map((g, idx) => {
        const isOpen = open === g.key;
        const panelId = `${base}-${g.key}`;
        return (
          <div
            key={g.key}
            className="relative"
            onPointerEnter={(e) => { if (e.pointerType === "mouse") { cancelClose(); if (open !== g.key) byHover.current = true; setOpen(g.key); } }}
            onPointerLeave={(e) => {
              if (e.pointerType !== "mouse") return;
              cancelClose();
              closeTimer.current = setTimeout(() => setOpen((v) => (v === g.key ? null : v)), 120);
            }}
          >
            <button
              type="button"
              data-trigger={g.key}
              aria-expanded={isOpen}
              aria-controls={isOpen ? panelId : undefined}
              onClick={() => {
                // A click on a panel that hover just opened keeps it open (pins it); otherwise it toggles.
                if (isOpen && byHover.current) { byHover.current = false; return; }
                byHover.current = false;
                setOpen(isOpen ? null : g.key);
              }}
              onKeyDown={(e) => onTriggerKey(e, g.key, idx)}
              className={`inline-flex min-h-10 items-center gap-1 whitespace-nowrap rounded-lg px-2 text-sm font-semibold transition hover:bg-brand-soft hover:text-brand-hover ${isOpen ? "bg-brand-soft text-brand-hover" : "text-midnight"}`}
            >
              {g.title}
              <ChevronDown className={`size-3.5 transition ${isOpen ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {isOpen ? (
              <div
                ref={panel}
                id={panelId}
                className="absolute start-0 top-full z-50 w-[19rem] max-w-[calc(100vw-2rem)] pt-2"
                onKeyDown={(e) => onPanelKey(e, g.key)}
              >
                <ul className="rounded-2xl border border-line bg-white p-2 shadow-float">
                  {g.items.map((it) => (
                    <li key={it.label}>
                      {it.soon || !it.href ? (
                        <span aria-disabled="true" className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted">
                          {it.label}
                          <span className="shrink-0 rounded-full bg-line/70 px-2 py-0.5 text-[11px] font-semibold text-muted">{soon}</span>
                        </span>
                      ) : (
                        <Link href={it.href} onClick={() => setOpen(null)} className="block rounded-xl px-3 py-2.5 transition hover:bg-brand-soft focus-visible:bg-brand-soft">
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
        <Link key={l.href} href={l.href} className="inline-flex min-h-10 items-center whitespace-nowrap rounded-lg px-2 text-sm font-semibold text-midnight transition hover:bg-brand-soft hover:text-brand-hover">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
