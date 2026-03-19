# Resource Planner

Webapplikasjon for bemanningsplanlegging av produktteam. Erstatter manuell Excel-basert prosess med en normalisert domenemodell for kapasitet, kompetanse, allokering og kostnadsberegning.

---

## Lokal utvikling

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

### 3. Start databasen og Keycloak

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

## Produksjon

### Forutsetninger

- Docker
- Ekstern PostgreSQL
- Ekstern Keycloak (med AD-backend, HTTPS)

### 1. Konfigurer miljøvariabler

```bash
cp .env.production.example .env.production
# Fyll inn DATABASE_URL, AUTH_SECRET, Keycloak-variabler osv.
```

### 2. Bygg og start med Docker

```bash
docker compose -f docker-compose.prod.yml up --build
```

Eller manuelt:

```bash
docker build -t resource-planner .
docker run --env-file .env.production -p 3000:3000 resource-planner
```

Prisma-migreringer kjøres automatisk ved oppstart. Ingen manuell migreringssteg nødvendig.

### Produksjonsmiljøvariabler

Se [`.env.production.example`](.env.production.example) for fullstendig liste. Viktigste variabler:

| Variabel | Beskrivelse |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL-tilkoblingsstreng |
| `AUTH_URL` | Offentlig URL til applikasjonen |
| `AUTH_SECRET` | Tilfeldig hemmelighet (`openssl rand -base64 32`) |
| `AUTH_KEYCLOAK_ID` | Keycloak-klient-ID |
| `AUTH_KEYCLOAK_SECRET` | Keycloak-klienthemmelighet |
| `AUTH_KEYCLOAK_ISSUER` | Keycloak realm-URL |

---

## Nyttige kommandoer

### Utvikling

| Kommando | Beskrivelse |
|----------|-------------|
| `npm run dev` | Start utviklingsserver |
| `npm run db:migrate` | Kjør nye migreringer (interaktivt) |
| `npm run db:seed` | Last inn seed-data |
| `npm run db:studio` | Åpne Prisma Studio (databaseeditor) |
| `npm run db:reset` | Nullstill databasen og kjør seed på nytt |
| `docker compose up -d` | Start PostgreSQL + Keycloak |
| `docker compose down` | Stopp tjenestene |
| `docker compose down -v` | Stopp og slett data |

### Produksjon

| Kommando | Beskrivelse |
|----------|-------------|
| `docker build -t resource-planner .` | Bygg produksjonsimage |
| `docker compose -f docker-compose.prod.yml up` | Start prod-image lokalt |
| `docker images resource-planner` | Sjekk imagestørrelse |

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
├── docker-compose.yml          # Lokal utvikling (PostgreSQL + Keycloak)
├── docker-compose.prod.yml     # Prod-test (kun app, ekstern DB/Keycloak)
├── Dockerfile                  # Multi-stage produksjonsimage
├── docker-entrypoint.sh        # Kjører migrate deploy ved oppstart
├── .env.example                # Miljøvariabel-mal for utvikling
└── .env.production.example     # Miljøvariabel-mal for produksjon
```

---

## Arkitektur

Se [docs/adr/0001-initial-decisions.md](docs/adr/0001-initial-decisions.md) for fullstendig beslutningslogg.

Kjerneprinsipp: **Bygg domenemodellen for bemanning, allokering, kostnad og rapportering — ikke en digital kopi av Excel-faner.**

- All forretningslogikk (kostnad, FTE, overbooking) ligger i `lib/domain/calculations.ts`
- Beregninger gjøres server-side, ikke i React-komponenter
- `allocationPct` lagres som `Decimal(5,4)` (0.0–1.0), vises som 0–100 % i UI
- Normtimer og faktureringsgrad er konfigurerbare per periode/ressurs, ikke hardkodet
- Produksjonsimage bruker Next.js standalone-output — vesentlig mindre enn full `node_modules`
