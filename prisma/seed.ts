/**
 * Seed script for Resource Planner.
 *
 * Leser fra prisma/seed-data.ts — rediger den filen for å endre data.
 * Kjøres ved db:reset eller manuelt med npm run db:seed.
 *
 * Bruk:
 *   npm run db:seed           — last inn seed-data
 *   npm run db:reset          — nullstill DB og kjør seed på nytt
 */

import "dotenv/config";
import {
  PrismaClient,
  EmploymentType,
  ResourceType,
  ScenarioStatus,
  CostBasis,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  companyTypes,
  companies,
  competencies,
  tags,
  teams,
  resources,
  scenarios,
  allocations,
} from "./seed-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starter seed fra seed-data.ts...");

  // ─── 1. Firmatyper ──────────────────────────────────────────────────────

  for (const ct of companyTypes) {
    await prisma.companyType.upsert({
      where: { id: ct.id },
      create: { id: ct.id, name: ct.name, description: ct.description ?? undefined },
      update: { name: ct.name, description: ct.description ?? undefined },
    });
  }
  console.log(`  ✅ ${companyTypes.length} firmatyper`);

  // ─── 2. Firma ────────────────────────────────────────────────────────────

  for (const c of companies) {
    await prisma.company.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        name: c.name,
        companyTypeId: c.companyTypeId,
        isInternalCompany: c.isInternalCompany,
        active: c.active,
      },
      update: {
        name: c.name,
        companyTypeId: c.companyTypeId,
        isInternalCompany: c.isInternalCompany,
        active: c.active,
      },
    });
  }
  console.log(`  ✅ ${companies.length} firma`);

  // ─── 3. Kompetanser ──────────────────────────────────────────────────────

  for (const c of competencies) {
    await prisma.competency.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        name: c.name,
        category: c.category ?? undefined,
        description: c.description ?? undefined,
      },
      update: { name: c.name },
    });
  }
  console.log(`  ✅ ${competencies.length} kompetanser`);

  // ─── 4. Tags ─────────────────────────────────────────────────────────────

  for (const t of tags) {
    await prisma.tag.upsert({
      where: { id: t.id },
      create: { id: t.id, name: t.name, color: t.color ?? undefined },
      update: { name: t.name, color: t.color ?? undefined },
    });
  }
  console.log(`  ✅ ${tags.length} tags`);

  // ─── 5. Team (uten teamLead/attestant/godkjenner — settes etter ressurser) ──

  for (const t of teams) {
    await prisma.team.upsert({
      where: { id: t.id },
      create: {
        id: t.id,
        name: t.name,
        description: t.description ?? undefined,
        projectCode: t.projectCode,
        konto: t.konto ?? undefined,
        koststed: t.koststed ?? undefined,
        active: t.active,
      },
      update: {
        name: t.name,
        description: t.description ?? undefined,
        konto: t.konto ?? undefined,
        koststed: t.koststed ?? undefined,
        active: t.active,
      },
    });

    // Synkroniser tags
    await prisma.teamTag.deleteMany({ where: { teamId: t.id } });
    for (const tagId of t.tagIds) {
      await prisma.teamTag.create({ data: { teamId: t.id, tagId } });
    }
  }
  console.log(`  ✅ ${teams.length} team`);

  // ─── 6. Ressurser og ratekort ────────────────────────────────────────────

  for (const r of resources) {
    await prisma.resource.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        type: r.type as ResourceType,
        name: r.name,
        employmentType: r.employmentType as EmploymentType,
        companyId: r.companyId,
        primaryRole: r.primaryRole ?? undefined,
      },
      update: {
        name: r.name,
        employmentType: r.employmentType as EmploymentType,
        companyId: r.companyId,
        primaryRole: r.primaryRole ?? undefined,
      },
    });

    for (const rc of r.rateCards) {
      const effectiveFrom = new Date(rc.effectiveFrom);
      const existing = await prisma.rateCard.findFirst({
        where: { resourceId: r.id, effectiveFrom },
      });
      const data = {
        effectiveTo: rc.effectiveTo ? new Date(rc.effectiveTo) : null,
        costBasis: rc.costBasis as CostBasis,
        hourlyRateNok: rc.hourlyRateNok,
        monthlyRateNok: rc.monthlyRateNok,
        vatPct: rc.vatPct,
        invoiceFactor: rc.invoiceFactor,
        source: rc.source,
      };
      if (existing) {
        await prisma.rateCard.update({ where: { id: existing.id }, data });
      } else {
        await prisma.rateCard.create({
          data: { resourceId: r.id, effectiveFrom, ...data },
        });
      }
    }
  }
  console.log(`  ✅ ${resources.length} ressurser`);

  // ─── 7. Koble teamLead/attestant/godkjenner ──────────────────────────────

  for (const t of teams) {
    if (t.teamLeadId || t.attestantId || t.godkjennerId) {
      await prisma.team.update({
        where: { id: t.id },
        data: {
          teamLeadId: t.teamLeadId ?? null,
          attestantId: t.attestantId ?? null,
          godkjennerId: t.godkjennerId ?? null,
        },
      });
    }
  }

  // ─── 8. Scenarioer og planperioder ──────────────────────────────────────

  // Første pass: opprett uten prevScenarioId for å unngå FK-syklus
  for (const s of scenarios) {
    await prisma.scenario.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        name: s.name,
        year: s.year,
        status: s.status as ScenarioStatus,
        description: s.description ?? undefined,
        externalCostOffsetMonths: s.externalCostOffsetMonths,
        prevScenarioId: null,
      },
      update: {
        name: s.name,
        year: s.year,
        status: s.status as ScenarioStatus,
        description: s.description ?? undefined,
        externalCostOffsetMonths: s.externalCostOffsetMonths,
      },
    });

    for (const pp of s.planningPeriods) {
      await prisma.planningPeriod.upsert({
        where: { id: pp.id },
        create: {
          id: pp.id,
          scenarioId: s.id,
          year: pp.year,
          month: pp.month,
          workingHoursNorm: pp.workingHoursNorm,
        },
        update: { workingHoursNorm: pp.workingHoursNorm },
      });
    }
  }

  // Andre pass: sett prevScenarioId
  for (const s of scenarios) {
    if (s.prevScenarioId) {
      await prisma.scenario.update({
        where: { id: s.id },
        data: { prevScenarioId: s.prevScenarioId },
      });
    }
  }
  console.log(`  ✅ ${scenarios.length} scenarioer`);

  // ─── 9. Allokeringer ─────────────────────────────────────────────────────

  let allocCount = 0;
  for (const a of allocations) {
    await prisma.allocation.upsert({
      where: {
        scenarioId_teamId_resourceId_planningPeriodId: {
          scenarioId: a.scenarioId,
          teamId: a.teamId,
          resourceId: a.resourceId,
          planningPeriodId: a.planningPeriodId,
        },
      },
      create: {
        scenarioId: a.scenarioId,
        teamId: a.teamId,
        resourceId: a.resourceId,
        planningPeriodId: a.planningPeriodId,
        allocationPct: a.allocationPct,
      },
      update: { allocationPct: a.allocationPct },
    });
    allocCount++;
  }
  console.log(`  ✅ ${allocCount} allokeringer`);

  console.log("\n✅ Seed ferdig!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Seed feilet:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
