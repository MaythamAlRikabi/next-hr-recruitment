# Competitive gap analysis (2026-10-30)

Purpose: use four recruitment sites as benchmarks for information architecture, service coverage and user journeys. Nothing is copied (code, text, imagery, trademarks, designs).

## What could actually be observed
| Benchmark | Access in this environment | Notes |
|---|---|---|
| worldwide-rs.com (WRS) | Home page read (paraphrased) | See below |
| tagirecruit.com (TAG-Recruit) | Only one news page read; the requested home URL was blocked | Observations limited to that page |
| mselect.com Iraq page | **Blocked.** Only a third-party news post (IBBC, Feb 2026) was read | Services/IA of the Iraq page NOT observed |
| mindfieldresources.com | **Blocked.** A directory listing also failed | NOT observed |

For mselect and Mindfield, the only lessons used are those the project brief states ("bold messaging, premium hero, executive positioning"; "detailed corporate services and country-specific pages"). They are labelled *from the brief*, not verified by inspection.

## Observed patterns (paraphrased)
**WRS** — audience split from the first screen (candidates vs clients); utility bar with Job Search and Submit a CV; six top areas (Jobs, Employers, Industries, About, Resource Hub, Contact & Offices); industry-specialised pages; recruitment solutions (contractor, permanent, managed services, executive search) plus consultancy solutions; certifications and scale metrics near the top; client and candidate testimonials; news feed; a visible impersonation/scam warning; job alerts; a CV form that feeds a talent database.
**TAG-Recruit (one page)** — Employers has its own menu entry; job seekers reach the board via the openings list; the page shows latest openings by country without search/filter UI; no CV upload visible on that page; Arabic language switch.
**mselect (secondary source only)** — positions on labour-market intelligence (an annual Iraq employment outlook report) as a trust and lead-generation asset.

## Gap table (NEXT today vs target in the brief)
Labels: DONE & TESTED / IMPLEMENTED NOT VERIFIED / BLOCKED / NOT STARTED.
| Capability | Benchmark lesson | NEXT now | Plan |
|---|---|---|---|
| Separate job-seeker / employer entry points | WRS, TAG | Hero + three audience cards (DONE locally) | Mobile quick actions: Find Jobs, Post a Job, Upload CV |
| Top-level IA with Executive Search and Insights | WRS (exec search under recruitment), mselect (reports) | Missing → being added this round | `/executive-search`, `/insights` |
| Independent Submit CV / talent pool | WRS | Missing | `/submit-cv` info page now; secure upload + consent need migration 0007 + storage (NOT STARTED) |
| Industry specialisation | WRS | 11 industry tiles on home | Landing pages per sector/location after job data exists |
| Location browsing | brief | Missing | Location tiles (Baghdad, Erbil, Basra, …) linking to filtered jobs |
| Trust signals | WRS (certs, stats, awards) | None — and none may be invented | Show only real, approved items; empty slot is omitted, not faked |
| Testimonials / case studies | WRS | None | Only when approved; section hidden until then |
| Job alerts | WRS | Missing | Table drafted in 0007; UI NOT STARTED |
| Scam / impersonation warning | WRS | Report-abuse page exists | Add a short warning on jobs and contact pages (text, no claims) |
| Labour-market content | mselect | Missing | Articles CMS drafted in 0007; page shows honest empty state; no fabricated statistics |
| Managed recruitment workflow | WRS managed services | Inquiry form only | `recruitment_requests`, assignments, shortlists drafted in 0007; Agency dashboard NOT STARTED |
| Confidential roles | WRS/Mindfield-style exec search | Missing | Job recruitment method + confidential employer fields drafted in 0007 |

## Honest limits
This analysis rests on partial observation. It must be redone with the two blocked sites if the owner supplies them (pages saved as files or PDFs).


## Update 2026-10-30 (owner-supplied service lists for mselect and Mindfield)
The owner supplied the service names of the two blocked sites. These are used as **service-taxonomy hints only**; the sites themselves were still not inspected, so nothing about their pages, copy or design is claimed.

| Source (owner-supplied) | Service names given |
|---|---|
| mselect | Executive Search, Permanent Recruitment, Workforce Planning, Outsourcing, Employer of Record, Payroll, Training |
| Mindfield | Executive Search, Contingency Search, Talent Mapping, Leadership Advisory, Confidential Senior Hiring |

### Mapping to NEXT (what is offered vs not offered)
| Service | NEXT status on the site |
|---|---|
| Executive Search | Offered as a service page and `/executive-search` |
| Permanent Recruitment | Offered (`/services/permanent-recruitment`) |
| Workforce Planning | Offered as an advisory service page |
| Talent Mapping | Offered as a service page |
| Leadership Advisory | Covered inside Executive Search / Recruitment Advisory copy; no separate claim |
| Contingency Search | Added as `/services/contingency-search` (service description only; no fee terms stated) |
| Confidential Senior Hiring | Supported by the "Confidential Executive" recruitment method; candidate-facing listing hidden by design |
| Outsourcing, Employer of Record, Payroll, Training | **Not offered.** Shown only in a dashed "Not offered yet" roadmap card on `/services`; no forms, no promises, no dates |

Rule kept: a service that NEXT does not operate is never presented as available.
