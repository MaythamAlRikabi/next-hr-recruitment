# UI Component Library (V3)

| Component | File | Status |
|-----------|------|--------|
| Navbar + mega menu (disclosure pattern, Esc/outside click/blur close, disabled items) | components/layout/{Header,MegaMenu}.tsx | DONE & TESTED |
| Mobile nav (accordion via `<details>`, 44 px targets) | components/layout/MobileMenu.tsx | DONE & TESTED |
| Search input (GET form, works without JS) | components/home/SearchBar.tsx | DONE & TESTED |
| Hero visual (native, no baked text/stats) | components/home/HeroVisual.tsx | DONE & TESTED |
| Job card | components/jobs/JobCard.tsx | IMPLEMENTED NOT VERIFIED with data |
| Latest jobs / Verified companies (DB + empty state) | components/home/DbSections.tsx | empty state tested; data path NOT VERIFIED |
| Page header (dark) / Section / StatusNote | components/ui/PageHeader.tsx | DONE & TESTED |
| KPI card, progress bar, step list, empty / error state, skeleton | components/ui/kit.tsx | IMPLEMENTED NOT VERIFIED (auth-gated pages) |
| Buttons, cards, badges, inputs (class recipes) | components/ui/styles.ts | DONE & TESTED |
| Form actions for staff / employer / candidate | components/forms/* | IMPLEMENTED NOT VERIFIED |
| Employer card, candidate card, data table, kanban, multi-select filters, file upload widget, notification center, dialog, toast | — | NOT STARTED |
All components support AR/EN; direction handled with logical properties (`ms-`, `ps-`, `start-0`, `rtl:rotate-180`).
