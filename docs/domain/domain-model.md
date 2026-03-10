# Domain Model

## Oversikt

Resource Planner er bygget rundt et normalisert domene for bemanningsplanlegging. Kjernen er at **ressurser allokeres til team i månedlige perioder innenfor et scenario**.

```
Scenario ──── PlanningPeriod (år+måned, normtimer)
    │               │
    └── Allocation ─┤
           │        │
        Resource  Team
           │
        RateCard (tidsavgrenset sats)
        ResourceCompetency
           │
        Competency
           │
        Company
           │
        CompanyType
```

## Entiteter

### CompanyType
Kategoriserer firma: produksjonsbedrift, bemanningsforetak, konsulenthus, intern virksomhet, etc.

### Company
Et firma ressurser jobber for eller er ansatt i. Feltet `isInternalCompany` skiller mellom intern arbeidsgiver og ekstern leverandør.

### Team
Et produktteam med unik `projectCode`. Ressurser allokeres mot team.

### Competency
Styrt kompetansekatalog med kategori. Brukes til å søke opp ressurser og planlegge vakante roller.

### Resource
En person eller en planlagt/vakant stilling (`placeholder`). Koblet til ett firma. Har `employmentType` som skiller interne fra konsulenter (eksterne).

### ResourceCompetency
Kobling mellom ressurs og kompetanse med nivå (1–5) og flagg for primærkompetanse.

### RateCard
Tidsavgrenset kostnadssats per ressurs. Støtter:
- `hourly`: timepris × normtimer × allokering
- `monthly`: fast månedssats × allokering
- `vatPct`: merverdiavgift (valgfritt)
- `invoiceFactor`: faktureringsgrad (default 1.0)

### Scenario
En navngitt plan for et gitt år (f.eks. «Budsjett 2026», «Prognose Q2 2026»). Status: `draft` → `approved` → `archived`.

### PlanningPeriod
En konkret måned innenfor et scenario. Inneholder `workingHoursNorm` — antall arbeidstimer den måneden. Denne verdien er konfigurerbar og ikke hardkodet.

### Allocation
Kjerneentiteten. Kobler ressurs til team for en planleggingsperiode med en prosentsats (`allocationPct` som Decimal 0.0–1.0).

### OtherCost
Andre kostnader enn personkostnader per team per periode (f.eks. lisenser, reise).

## Beregningsregler

Se `lib/domain/calculations.ts` for implementasjon.

| Størrelse | Formel |
|-----------|--------|
| Timer | `workingHoursNorm × allocationPct` |
| FTE | `sum(allocationPct)` per team per måned |
| Kostnad (ekstern, timebasert) | `hourlyRate × workingHoursNorm × allocationPct × invoiceFactor` |
| Kostnad (intern, timebasert) | `hourlyRate × workingHoursNorm × allocationPct` |
| Kostnad (månedssats) | `monthlyRate × allocationPct` |
| Årssum | `sum(månedskost jan–des)` |

## Datakonvensjoner

- `allocationPct`: lagres som `Decimal(5,4)` i databasen (0.0000–1.0000), vises som 0–100 % i UI
- `projectCode`: unik per team
- Overbooking (sum allocationPct > 1.0 for en ressurs en måned) er tillatt, men varsles tydelig
- Placeholder-ressurser har `type = placeholder` og representerer planlagte, ubesatte roller
