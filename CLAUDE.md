# CLAUDE.md — resource planner

## Formål
Dette prosjektet skal bygge en webapplikasjon som erstatter dagens Excel-baserte bemanningsplanlegging for produktteam.

Løsningen skal holde orden på:
- kapasitet per team og per ressurs
- kompetanse per ressurs
- kostnad per team per måned og totalt per år
- FTE (fulltidsekvivalenter) per team per måned
- skille mellom fast ansatte (interne) og konsulenter (eksterne)
- rapportering per team, per ressurs, per firma og samlet

**Databasen er obligatorisk.** Ikke bygg en løsning som kun lever i frontend-state eller i lokale filer.

---

## Produktkontekst
Domeneobjektene som minimum:
- **Team**: navn, beskrivelse, prosjektkode
- **Ressurs**: navn, firma, timepris, kompetanse, intern/innleid
- **Firma**: navn, type (for eksempel produksjonsbedrift, bemanningsforetak, konsulenthus)
- **Allokering**: ressurs fordelt mot ett eller flere team med prosentandel per måned

Løsningen skal kunne vise:
- hvor mye tid hver ressurs bruker i hvert team hver måned
- månedlig kostnad per team
- månedlig FTE per team
- total årlig kostnad per team og samlet
- rapporter for **interne**, **eksterne** og **samlet**

---

## Observasjoner fra dagens Excel-prosess
Bruk dagens regneark som domeneinput, men **ikke** kopier Excel-strukturen 1:1 inn i databasen.

Viktige observasjoner fra regnearket:
- Hvert team har i praksis en egen planleggingsflate med månedskolonner fra januar til desember.
- Ressurser kan være fordelt på flere team samtidig samme måned.
- Det finnes en samlet oversikt som summerer bemanning og kostnader på tvers av team.
- Konsulenter og interne ansatte behandles forskjellig i kostnadsmodellen.
- Regnearket bruker eksplisitte globale antakelser for månedsverk og faktureringsgrad. Disse må være **konfigurerbare** i løsningen, ikke hardkodet.
- Det finnes plassholdere som `NN` og teamspesifikke varianter av `NN`. Løsningen må derfor kunne støtte **planlagte/vakante ressurser**, ikke bare navngitte personer.
- Det finnes også linjer for **andre kostnader** enn rene personkostnader. Dette bør avklares som MVP eller fase 2.

Konsekvens:
- Lag en **normalisert domenemodell**.
- Ikke lag én tabell per team eller én tabell per år.
- Ikke lag én kolonne per måned i kjernekjernen av domenelogikken hvis det kan unngås.
- Bruk i stedet perioder, allokeringer og kostnadsregler som data.

---

## Før du skriver kode: still disse spørsmålene først
Brukeren har utviklerbakgrunn og vil bli involvert i sentrale arkitekturvalg. Før du lager struktur eller skriver mye kode, still disse spørsmålene og oppsummer valgene i en beslutningslogg.

### 1) Foretrukket applikasjonsarkitektur
Spør:
- Vil du ha en fullstack-monolitt for raskest mulig levering?
- Eller separat frontend og backend/API?

Foreslå som utgangspunkt:
- **MVP-default**: fullstack TypeScript-løsning med web-UI og databasebackend

### 2) Teknologistack
Spør:
- Foretrekker du TypeScript/Node, .NET, Python eller noe annet?
- Vil du optimalisere for rask utvikling, enterprise-standardisering eller integrasjon mot eksisterende miljø?

Hvis brukeren ikke har en klar preferanse, foreslå:
- **Frontend + backend**: Next.js fullstack med TypeScript
- **Database**: PostgreSQL
- **ORM/migreringer**: Prisma eller tilsvarende moden ORM

### 3) Databasevalg og drift
Spør:
- Skal databasen kjøres lokalt i Docker i utvikling?
- Skal produksjon bruke managed PostgreSQL eller egen drift?
- Er det krav om Azure eller annet spesifikt miljø?

### 4) Autentisering og roller
Spør:
- Er dette kun for deg i starten, eller for flere brukere?
- Trengs innlogging nå, eller kan det vente til etter MVP?
- Trengs roller som admin, planner, read-only, teamleder?

### 5) Historikk og scenarier
Spør:
- Skal løsningen kun ha én gjeldende plan?
- Eller må den støtte flere scenarier som budsjett, prognose, revidert prognose og baseline?
- Må vi kunne se historikk over endringer?

**Anbefaling:** støtt scenarier tidlig. Det er mye enklere å gjøre fra starten enn å retrofitte senere.

### 6) Kostnadsmodell
Spør:
- Hvordan skal kostnad for interne ansatte beregnes: standard intern timepris, faktisk lønnskost, eller månedlig standardsats?
- Skal mva håndteres eksplisitt i modellen for konsulenter?
- Skal faktureringsgrad være global, per firma, per ressurs eller per avtale?
- Kan satser endres midt i året?

### 7) Kompetansemodell
Spør:
- Skal kompetanse være fritekst-tagger eller en styrt katalog?
- Skal kompetanse ha nivåer, for eksempel junior/medior/senior eller 1–5?
- Skal ressurs ha én primærrolle og flere sekundære kompetanser?

### 8) Planleggingsdetalj
Spør:
- Skal allokering lagres som prosent eller timer?
- Skal UI vise prosent, timer eller begge deler?
- Skal total allokering over 100 % være blokkert, eller tillatt med tydelig varsel?

### 9) Import fra eksisterende Excel
Spør:
- Trengs engangsimport av dagens fil?
- Eller skal Excel-import være en fast funksjon?
- Må importen også støtte opprydding i plassholdere, manglende firma og datakvalitetsfeil?

### 10) Rapportering og eksport
Spør:
- Hvilke rapporter er viktigst i MVP?
- Trengs Excel-eksport, CSV-eksport eller PDF senere?
- Trengs rapport per team, firma, kompetanse, ressurs og scenario?

---

## Foreslått MVP-avgrensning
Bygg først en løsning som dekker dette:
1. CRUD for team, firma, ressurser og kompetanser
2. Registrering av kostnadsgrunnlag per ressurs
3. Månedlig allokering av ressurs mot ett eller flere team
4. Validering av overbooking per ressurs per måned
5. Rapport per team for kostnad og FTE per måned
6. Rapport samlet for internt, eksternt og totalt
7. Årssummer per team og samlet
8. Enkel import eller seed basert på dagens Excel-logikk

Ikke start med avansert auth, avansert tilgangsstyring eller komplisert forecasting før grunnmodellen fungerer.

---

## Foreslått domenemodell
Bruk en modell som ligner dette konseptuelt:

### Kjerneentiteter
- **CompanyType**
  - id
  - name
  - description

- **Company**
  - id
  - name
  - companyTypeId
  - isInternalCompany
  - active

- **Team**
  - id
  - name
  - description
  - projectCode
  - active

- **Resource**
  - id
  - type (`person` | `placeholder`)
  - name
  - employmentType (`internal` | `external`)
  - companyId
  - primaryRole
  - activeFrom
  - activeTo
  - notes

- **Competency**
  - id
  - name
  - category
  - description

- **ResourceCompetency**
  - id
  - resourceId
  - competencyId
  - level
  - isPrimary

- **Scenario**
  - id
  - name
  - year
  - status (`draft` | `approved` | `archived`)
  - description

- **PlanningPeriod**
  - id
  - scenarioId
  - year
  - month
  - workingHoursNorm

- **RateCard**
  - id
  - resourceId
  - effectiveFrom
  - effectiveTo
  - costBasis (`hourly` | `monthly`)
  - hourlyRateNok
  - monthlyRateNok
  - vatPct
  - invoiceFactor
  - source

- **Allocation**
  - id
  - scenarioId
  - teamId
  - resourceId
  - planningPeriodId
  - allocationPct
  - allocationHours
  - notes

- **OtherCost**
  - id
  - scenarioId
  - teamId
  - planningPeriodId
  - category
  - description
  - amountNok

### Viktige regler
- `projectCode` bør være unik per team.
- `allocationPct` lagres som desimal mellom `0.0` og `1.0` i databasen, men vises som `0–100 %` i UI.
- En ressurs kan ha flere allokeringer samme måned, men summen bør normalt ikke overstige `1.0` per scenario.
- `placeholder` må støttes eksplisitt fordi planlegging også gjelder ubesatte roller.
- Satser må kunne være tidsavgrenset, fordi timepris kan endres i løpet av året.

---

## Beregningsregler
All kostnadslogikk skal ligge i en testbar domenetjeneste, ikke i UI-komponenter.

### FTE
- `monthlyFte = sum(allocationPct)`
- Per team: summer allokeringene for alle ressurser i perioden
- Per ressurs: summer allokeringene på tvers av team i perioden

### Timer
- `allocationHours = workingHoursNorm * allocationPct`

### Kostnad
Bruk eksplisitt kostnadsmodell, ikke spredte regnearkformler.

Eksempel på regler:
- **Ekstern ressurs**:
  - månedskost = `hourlyRate * workingHoursNorm * allocationPct`
  - eventuelt justert med `vatPct` og `invoiceFactor`
- **Intern ressurs**:
  - månedskost = `internalRate * workingHoursNorm * allocationPct`
  - alternativt en definert månedssats hvis brukeren ønsker det

Viktig:
- ikke hardkod `162` timer eller `0.88` faktureringsgrad i kode
- slike verdier skal ligge i konfigurasjon eller data per scenario/periode/per avtale

### Rapporter som må finnes
- kostnad per team per måned
- FTE per team per måned
- kostnad per ressurs per måned
- ressursbruk per team per måned
- samlet kostnad og FTE for internt, eksternt og totalt
- årsoppsummering per team og samlet

---

## API- og backend-prinsipper
Hvis løsningen bygges som fullstack, hold domenelogikken i tydelige server-side moduler.

Minimumskrav:
- bruk migreringer for alle databaseskjema-endringer
- ha seed-data for lokal utvikling
- ha tydelig validering ved oppretting og oppdatering
- skill mellom:
  - persistenslag
  - domenelogikk / kalkulasjonsmotor
  - presentasjonslag

Unngå:
- å bygge rapporter direkte med tung UI-logikk
- å duplisere kalkulasjoner i frontend og backend
- å lagre ferdigregnede totaler uten god grunn

Beregn totalsummer dynamisk eller via dedikerte report-queries/views.

---

## UI-prinsipper
MVP-UI bør ha disse flatene:

### 1) Masterdata
- Team
- Ressurser
- Firma
- Kompetanser
- Satser / rate cards

### 2) Planlegging
- månedsvis grid for allokeringer
- filtrering per team, ressurs, firma, kompetanse og scenario
- tydelig varsling ved overbooking
- drilldown fra team til ressursnivå

### 3) Rapportering
- teamrapport per måned
- porteføljerapport per måned
- intern vs ekstern vs total
- årsoppsummering
- visning av både FTE og kostnad side om side

### 4) Import/eksport
- enkel import fra Excel/CSV som fase 1 eller 2
- eksport til Excel/CSV for rapportdeling

---

## Tekniske føringer
Uansett stack:
- bruk TypeScript hvis du velger JS/TS-økosystemet
- bruk PostgreSQL som primær database
- kjør lokal utvikling med Docker Compose hvis det gir enklere oppstart
- legg all forretningslogikk i testbare moduler
- skriv enkle, eksplisitte migreringer
- bygg løsningen slik at scenario-støtte og historikk kan legges til uten å rive kjernen

Hvis brukeren ikke velger noe annet, kan du foreslå denne defaulten:
- Next.js fullstack
- PostgreSQL
- Prisma
- server-side domenetjenester for kalkulasjon og rapportering
- komponentbibliotek for raske admin-/tabellflater
- automatiske tester for kostnads- og FTE-logikk

---

## Kvalitetskrav
Før noe anses som ferdig:
- alle sentrale kalkulasjoner skal ha automatiserte tester
- årssum skal alltid være sum av månedssummer
- rapport internt + eksternt skal stemme med totalrapport
- overbooking skal oppdages og vises tydelig
- satser med gyldighetsperioder skal testes
- importerte data skal valideres og gi tydelige feilmeldinger

Lag minimum disse testcasene:
1. én ekstern ressurs 100 % i ett team hele året
2. én ressurs 50/50 fordelt mellom to team
3. én intern ressurs med standard intern sats
4. prisendring fra og med en bestemt måned
5. ressurs med total allokering over 100 % samme måned
6. rapportering separat for interne og eksterne
7. placeholder-ressurs uten tilknyttet faktisk person
8. team med både personkostnader og andre kostnader

---

## Implementasjonsrekkefølge
Foreslå og gjennomfør i denne rekkefølgen:
1. Avklar arkitekturvalg med brukeren
2. Opprett beslutningslogg for valgte prinsipper
3. Lag databaseskjema og migreringer
4. Implementer kjerneentiteter og CRUD
5. Implementer kalkulasjonsmotor for FTE og kostnad
6. Implementer allokerings-UI
7. Implementer rapporter
8. Legg til import/eksport
9. Legg til auth/roller hvis nødvendig

Ikke hopp rett til UI før datamodell og beregningsregler er klare.

---

## Beslutningslogg
Opprett og vedlikehold en enkel beslutningslogg i repoet, for eksempel `docs/decisions.md` eller ADR-er.

Første beslutninger som må logges:
- valgt stack
- valgt deploymodell
- auth-strategi
- scenario-støtte ja/nei
- kostnadsmodell for interne
- mva-håndtering for eksterne
- kompetansemodell
- importstrategi fra Excel

---

## Viktigste prinsipp
**Bygg domenemodellen for bemanning, allokering, kostnad og rapportering — ikke en digital kopi av Excel-faner.**
