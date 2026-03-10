/**
 * Seed script for Resource Planner.
 *
 * Leser fra prisma/seed-data.ts — rediger den filen for å vaske data.
 * Kjør én gang for å populere databasen fra scratch.
 *
 * Bruk:
 *   npm run db:seed           — last inn seed-data.ts
 *   npm run db:reset          — nullstill DB og kjør seed på nytt
 *
 * For å regenerere seed-data.ts fra Excel:
 *   node scripts/extract-seed-data.mjs
 */

import "dotenv/config";
import { PrismaClient, EmploymentType, ResourceType, ScenarioStatus, CostBasis } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { resources, teams, allocations } from "./seed-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const YEAR = 2026;
const SCENARIO_NAME = "Prognose 2026";
const WORKING_HOURS_PER_MONTH = 162;

function isPlaceholder(name: string): boolean {
  return /^nn/i.test(name.trim());
}

async function main() {
  console.log("🌱 Starter seed fra seed-data.ts...");

  // ─── 1. Firma-typer ──────────────────────────────────────────────────────

  const internalType = await prisma.companyType.upsert({
    where: { name: "Intern virksomhet" },
    create: { name: "Intern virksomhet", description: "Virksomhetens egne ansatte" },
    update: {},
  });

  const consultingType = await prisma.companyType.upsert({
    where: { name: "Konsulenthus" },
    create: { name: "Konsulenthus", description: "Konsulentselskaper" },
    update: {},
  });

  for (const name of ["Bemanningsforetak", "Produksjonsbedrift", "Leverandør"]) {
    await prisma.companyType.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  // ─── 2. Internt firma ────────────────────────────────────────────────────

  const internalCompany = await prisma.company.upsert({
    where: { id: "internal-company" },
    create: {
      id: "internal-company",
      name: "Intern",
      companyTypeId: internalType.id,
      isInternalCompany: true,
    },
    update: {},
  });

  // ─── 3. Kompetanser ──────────────────────────────────────────────────────

  const competencyNames = [
    "Produktledelse", "Systemutvikling", "Frontendutvikling", "Backendutvikling",
    "DevOps", "Dataanalyse", "UX/design", "Prosjektledelse", "Arkitektur",
    "Testautomatisering", "Scrum / Agile", "Sikkerhet", "Natural/Adabas",
    "Tjenestedesign", "Forretningsutvikling", "Juridisk rådgivning",
  ];

  for (const name of competencyNames) {
    await prisma.competency.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  // ─── 4. Team ─────────────────────────────────────────────────────────────

  const teamMap = new Map<string, string>(); // projectCode → id
  for (const t of teams) {
    const team = await prisma.team.upsert({
      where: { projectCode: t.projectCode },
      create: { name: t.name, projectCode: t.projectCode },
      update: { name: t.name },
    });
    teamMap.set(t.projectCode, team.id);
  }
  console.log(`  ✅ ${teams.length} team opprettet/oppdatert`);

  // ─── 5. Firma (fra ressurslisten) ────────────────────────────────────────

  const uniqueCompanies = [
    ...new Set(
      resources.map((r) => r.company).filter((c): c is string => !!c)
    ),
  ].sort();

  const companyMap = new Map<string, string>(); // name → id
  companyMap.set("Intern", internalCompany.id);

  for (const name of uniqueCompanies) {
    const company = await prisma.company.upsert({
      where: { id: `co-${name.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}` },
      create: {
        id: `co-${name.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}`,
        name,
        companyTypeId: consultingType.id,
        isInternalCompany: false,
      },
      update: { name },
    });
    companyMap.set(name, company.id);
  }
  console.log(`  ✅ ${uniqueCompanies.length} firma opprettet/oppdatert`);

  // ─── 6. Ressurser og ratekort ────────────────────────────────────────────

  const resourceMap = new Map<string, string>(); // name → id (merk: duplikatnavn kan overskrives)

  for (const r of resources) {
    const companyId = r.isInternal
      ? internalCompany.id
      : r.company
      ? (companyMap.get(r.company) ?? internalCompany.id)
      : internalCompany.id;

    const employmentType = r.isInternal ? EmploymentType.internal : EmploymentType.external;
    const resourceType = isPlaceholder(r.name) ? ResourceType.placeholder : ResourceType.person;

    // Bruk navn+firma som unik nøkkel for å finne/opprette
    const existing = await prisma.resource.findFirst({
      where: { name: r.name, companyId },
    });

    let resourceId: string;
    if (existing) {
      await prisma.resource.update({
        where: { id: existing.id },
        data: { primaryRole: r.role ?? existing.primaryRole },
      });
      resourceId = existing.id;
    } else {
      const created = await prisma.resource.create({
        data: {
          name: r.name,
          type: resourceType,
          employmentType,
          companyId,
          primaryRole: r.role ?? null,
        },
      });
      resourceId = created.id;
    }

    resourceMap.set(r.name, resourceId);

    // Ratekort — opprett bare hvis det ikke finnes fra 2026-01-01
    if (r.hourlyRateNok !== null) {
      const existingRate = await prisma.rateCard.findFirst({
        where: {
          resourceId,
          effectiveFrom: new Date(YEAR, 0, 1),
        },
      });
      if (!existingRate) {
        await prisma.rateCard.create({
          data: {
            resourceId,
            effectiveFrom: new Date(YEAR, 0, 1),
            costBasis: CostBasis.hourly,
            hourlyRateNok: r.hourlyRateNok,
            invoiceFactor: 1.0,
            source: "seed-data.ts",
          },
        });
      }
    }
  }
  console.log(`  ✅ ${resources.length} ressurser opprettet/oppdatert`);

  // ─── 7. Scenario og perioder ─────────────────────────────────────────────

  const scenario = await prisma.scenario.upsert({
    where: { name_year: { name: SCENARIO_NAME, year: YEAR } },
    create: {
      name: SCENARIO_NAME,
      year: YEAR,
      status: ScenarioStatus.draft,
      description: "Importert fra Excel-prognose",
    },
    update: {},
  });

  const periodMap = new Map<number, string>(); // month → id
  for (let month = 1; month <= 12; month++) {
    const period = await prisma.planningPeriod.upsert({
      where: {
        scenarioId_year_month: { scenarioId: scenario.id, year: YEAR, month },
      },
      create: {
        scenarioId: scenario.id,
        year: YEAR,
        month,
        workingHoursNorm: WORKING_HOURS_PER_MONTH,
      },
      update: {},
    });
    periodMap.set(month, period.id);
  }

  // ─── 8. Allokeringer ─────────────────────────────────────────────────────

  let allocCount = 0;
  let warnCount = 0;

  for (const a of allocations) {
    const teamId = teamMap.get(a.projectCode);
    if (!teamId) {
      console.warn(`  ⚠️  Ukjent prosjektkode: ${a.projectCode} (for ressurs ${a.resource})`);
      warnCount++;
      continue;
    }

    const resourceId = resourceMap.get(a.resource);
    if (!resourceId) {
      console.warn(`  ⚠️  Ressurs ikke funnet: "${a.resource}"`);
      warnCount++;
      continue;
    }

    for (let m = 0; m < 12; m++) {
      const pct = a.months[m];
      if (!pct || pct <= 0) continue;

      const month = m + 1;
      const planningPeriodId = periodMap.get(month)!;

      await prisma.allocation.upsert({
        where: {
          scenarioId_teamId_resourceId_planningPeriodId: {
            scenarioId: scenario.id,
            teamId,
            resourceId,
            planningPeriodId,
          },
        },
        create: {
          scenarioId: scenario.id,
          teamId,
          resourceId,
          planningPeriodId,
          allocationPct: pct,
        },
        update: { allocationPct: pct },
      });
      allocCount++;
    }
  }

  console.log(`  ✅ ${allocCount} allokeringer opprettet/oppdatert`);
  if (warnCount > 0) console.warn(`  ⚠️  ${warnCount} advarsler — sjekk ressurs- og teamsnavn i seed-data.ts`);
  console.log(`\n✅ Seed ferdig!`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Seed feilet:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
