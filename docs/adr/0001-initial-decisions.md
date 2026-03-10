# ADR 0001 — Initial Architecture Decisions

**Status:** Accepted
**Date:** 2026-03-09

## Kontekst

Erstatter manuell Excel-basert bemanningsplanlegging for produktteam. Behovet er en normalisert domenemodell med allokering, kostnadsberegning og rapportering.

## Beslutninger

| Tema | Valg | Begrunnelse |
|------|------|-------------|
| Arkitektur | Fullstack monolitt (Next.js App Router) | Raskest mulig MVP, én deployment-enhet |
| Språk | TypeScript | Type-sikkerhet for beregningslogikk, felles språk frontend/backend |
| Framework | Next.js 15 (App Router) | Server Actions for enkel CRUD, Server Components for rapporter |
| Database | PostgreSQL | Modent, støtter Decimal-typer, god ORM-støtte |
| ORM | Prisma | Automatiske migreringer, type-safe queries, god TS-integrasjon |
| Lokal utvikling | Docker Compose (PostgreSQL) | Enkel oppstart, ingen lokal installasjon av Postgres nødvendig |
| Produksjon | Selvdriftet PostgreSQL | Fleksibilitet, ingen managed-kostnad i MVP-fasen |
| Auth | Ingen i MVP | Fokus på kjernedomenet, auth kan legges til som lag etterpå |
| Scenarier | Støttes fra start | Enklere å bygge inn enn å retrofitte, dekker budsjett/prognose-behov |
| Intern kostnad | Timepris × normtimer × allokeringsprosent | Konsistent modell for interne og eksterne |
| MVA | Opsjonelt felt per RateCard | Fleksibelt, ikke alle konsulenter har mva |
| Faktureringsgrad | `invoiceFactor` per RateCard | Konfigurerbar, ikke hardkodet |
| Kompetanse | Styrt katalog + nivå (1–5) | Bedre søk og rapportering enn fritekst-tagger |
| Allokering | Prosent (0.0–1.0) lagres, timer beregnes | Normtimer kan variere per periode |
| Overbooking | Varsles, ikke blokkert | Planlegging må tillate overstyring |
| Excel-import | Engangs seed-script | Tilstrekkelig for MVP, kan bygges ut til tilbakevendende import |
| UI-komponentbibliotek | shadcn/ui | Tilgjengelighetsvennlig, lav overhead, god Tailwind-integrasjon |
| Rapporter | Server-side beregning | Unngår duplisering av forretningslogikk i frontend |

## Viktige prinsipper

1. All kostnadslogikk ligger i `lib/domain/calculations.ts` — testbar, ingen UI-avhengigheter
2. `allocationPct` lagres som `Decimal(5,4)` mellom 0.0 og 1.0, vises som 0–100 % i UI
3. Normtimer (`workingHoursNorm`) er konfigurerbar per planleggingsperiode, ikke hardkodet
4. Satser er tidsavgrenset via `RateCard.effectiveFrom/effectiveTo`
5. Placeholder-ressurser støttes eksplisitt (type = `placeholder`)

## Konsekvenser

- Databasen er kilden til sannhet — ikke frontend-state
- Ingen tallverdier hardkodes i kode (162 timer, 0.88 faktureringsgrad)
- Scenario-entiteten gjør det mulig å ha parallelle planer (budsjett, prognose, revidert)
