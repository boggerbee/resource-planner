# Resource Planner

Webapplikasjon for bemanningsplanlegging av produktteam. Erstatter manuell Excel-basert prosess med en normalisert domenemodell for kapasitet, kompetanse, allokering og kostnadsberegning.

## Kom i gang

### Forutsetninger

- Node.js 20+
- Docker og Docker Compose

### 1. Klon og installer avhengigheter

```bash
npm install
```

### 2. Konfigurer miljøvariabler

```bash
cp .env.example .env
# Verdiene i .env.example passer for lokal Docker-utvikling
```

### 3. Start databasen

```bash
docker compose up -d
```

### 4. Kjør migreringer

```bash
npm run db:migrate
# Skriv inn et navn, f.eks. "init"
```

### 5. Last inn seed-data (fra Excel)

```bash
npm run db:seed
```

### 6. Start applikasjonen

```bash
npm run dev
```

Applikasjonen kjører på [http://localhost:3000](http://localhost:3000).

---

## Nyttige kommandoer

| Kommando | Beskrivelse |
|----------|-------------|
| `npm run dev` | Start utviklingsserver |
| `npm run db:migrate` | Kjør nye migreringer |
| `npm run db:seed` | Last inn seed-data |
| `npm run db:studio` | Åpne Prisma Studio (databaseeditor) |
| `npm run db:reset` | Nullstill databasen og kjør seed på nytt |
| `docker compose up -d` | Start PostgreSQL i bakgrunnen |
| `docker compose down` | Stopp PostgreSQL |
| `docker compose down -v` | Stopp PostgreSQL og slett data |

---

## Prosjektstruktur

```
resource-planner/
├── app/                    # Next.js App Router
│   ├── (admin)/            # Masterdata CRUD (team, ressurser, firma, kompetanser)
│   ├── (planning)/         # Allokeringsplanlegging
│   └── (reports)/          # Rapporter (team, portefølje, årssum)
├── lib/
│   └── domain/
│       ├── calculations.ts # Kostnads- og FTE-beregninger (testbar, ingen UI-avh.)
│       └── __tests__/      # Automatiske tester for beregninger
├── prisma/
│   ├── schema.prisma       # Komplett domenemodell
│   ├── seed.ts             # Import fra Excel + seed-data
│   └── migrations/         # Databasemigreringer
├── docs/
│   ├── adr/                # Architecture Decision Records
│   └── domain/             # Domenedokumentasjon
├── docker-compose.yml      # Lokal PostgreSQL
└── .env.example            # Miljøvariabel-mal
```

---

## Arkitektur

Se [docs/adr/0001-initial-decisions.md](docs/adr/0001-initial-decisions.md) for fullstendig beslutningslogg.

Kjerneprinsipp: **Bygg domenemodellen for bemanning, allokering, kostnad og rapportering — ikke en digital kopi av Excel-faner.**

- All forretningslogikk (kostnad, FTE, overbooking) ligger i `lib/domain/calculations.ts`
- Beregninger gjøres server-side, ikke i React-komponenter
- `allocationPct` lagres som `Decimal(5,4)` (0.0–1.0), vises som 0–100 % i UI
- Normtimer og faktureringsgrad er konfigurerbare per periode/ressurs, ikke hardkodet
