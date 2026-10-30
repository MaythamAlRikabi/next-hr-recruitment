import Link from "next/link";

/** Simple section tabs for the signed-in areas. Server component: the active tab is passed in. */
export function SubNav({ items, active, label }: { items: { href: string; label: string }[]; active: string; label: string }) {
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4">
      <ul className="flex min-w-max gap-2">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} aria-current={i.href === active ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold ${i.href === active ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"}`}>
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
