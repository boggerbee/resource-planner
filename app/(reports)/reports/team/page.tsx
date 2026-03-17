import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { computeMonthlyCost, resolveRateCard } from "@/lib/domain/calculations";
import { TeamReportFilters } from "./TeamReportFilters";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Des",
];

function formatNok(amount: number) {
  return new Intl.NumberFormat("nb-NO", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount / 1000));
}

type RateCardInput = {
  costBasis: "hourly" | "monthly";
  hourlyRateNok: number | null;
  monthlyRateNok: number | null;
  vatPct: number | null;
  invoiceFactor: number | null;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

function mapRateCards(rateCards: Array<{
  costBasis: string;
  hourlyRateNok: unknown;
  monthlyRateNok: unknown;
  vatPct: unknown;
  invoiceFactor: unknown;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}>): RateCardInput[] {
  return rateCards.map((rc) => ({
    ...rc,
    costBasis: rc.costBasis as "hourly" | "monthly",
    hourlyRateNok: rc.hourlyRateNok ? Number(rc.hourlyRateNok) : null,
    monthlyRateNok: rc.monthlyRateNok ? Number(rc.monthlyRateNok) : null,
    vatPct: rc.vatPct ? Number(rc.vatPct) : null,
    invoiceFactor: rc.invoiceFactor ? Number(rc.invoiceFactor) : null,
  }));
}

export default async function TeamReportPage({
  searchParams,
}: {
  searchParams: Promise<{ scenarioId?: string; teamId?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const [scenarios, teams] = await Promise.all([
    prisma.scenario.findMany({ orderBy: [{ year: "desc" }, { name: "asc" }] }),
    prisma.team.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const scenarioId = params.scenarioId ?? cookieStore.get("scenarioId")?.value ?? scenarios[0]?.id;
  const teamId = params.teamId ?? cookieStore.get("teamId")?.value ?? teams[0]?.id;

  if (!scenarioId || !teamId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Teamrapport</h1>
        <p className="text-gray-500">Ingen data funnet.</p>
      </div>
    );
  }

  const team = teams.find((t) => t.id === teamId);

  const [allocations, scenario] = await Promise.all([
    prisma.allocation.findMany({
      where: { scenarioId, teamId },
      include: {
        resource: { include: { rateCards: true } },
        planningPeriod: true,
      },
      orderBy: [{ planningPeriod: { month: "asc" } }, { resource: { name: "asc" } }],
    }),
    prisma.scenario.findUnique({
      where: { id: scenarioId },
      include: {
        prevScenario: {
          include: {
            allocations: {
              where: { teamId },
              include: {
                resource: { include: { rateCards: true } },
                planningPeriod: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const offset = scenario?.externalCostOffsetMonths ?? 0;
  const hasPrev = !!scenario?.prevScenario;

  // Build month × resource cost+fte table
  type ResourceMonth = { id: string; name: string; employmentType: string; resourceType: string; months: Record<number, { cost: number; fte: number; missingRate: boolean }> };
  const resourceMap = new Map<string, ResourceMonth>();

  function ensureResource(id: string, name: string, employmentType: string, resourceType: string) {
    if (!resourceMap.has(id)) {
      resourceMap.set(id, { id, name, employmentType, resourceType, months: {} });
    }
  }

  // Current scenario allocations — apply offset for external resources
  for (const alloc of allocations) {
    const deliveryMonth = alloc.planningPeriod.month;
    const year = alloc.planningPeriod.year;
    const pct = Number(alloc.allocationPct);
    const hoursNorm = Number(alloc.planningPeriod.workingHoursNorm);
    const isExternal = alloc.resource.employmentType === "external";

    const displayMonth = isExternal && offset > 0 ? deliveryMonth + offset : deliveryMonth;
    if (displayMonth > 12) continue; // falls into next year → exclude

    const rateCards = mapRateCards(alloc.resource.rateCards);
    const rateCard = resolveRateCard(rateCards, year, deliveryMonth);
    const cost = rateCard
      ? computeMonthlyCost({
          allocationPct: pct,
          rateCard,
          employmentType: alloc.resource.employmentType as "internal" | "internal_temporary" | "external",
          workingHoursNorm: hoursNorm,
        })
      : 0;

    ensureResource(alloc.resourceId, alloc.resource.name, alloc.resource.employmentType, alloc.resource.type);
    const existing = resourceMap.get(alloc.resourceId)!.months[displayMonth];
    if (existing) {
      existing.cost += cost;
      existing.fte += pct;
      if (!rateCard) existing.missingRate = true;
    } else {
      resourceMap.get(alloc.resourceId)!.months[displayMonth] = {
        cost,
        fte: pct,
        missingRate: !rateCard,
      };
    }
  }

  // Carry-over: allocations from prevScenario that shift into this year via offset
  if (offset > 0 && scenario?.prevScenario) {
    for (const prevAlloc of scenario.prevScenario.allocations) {
      if (prevAlloc.resource.employmentType !== "external") continue;

      const deliveryMonth = prevAlloc.planningPeriod.month;
      const bookingMonth = deliveryMonth + offset;
      if (bookingMonth <= 12) continue; // doesn't spill into this year
      const displayMonth = bookingMonth - 12;

      const pct = Number(prevAlloc.allocationPct);
      const hoursNorm = Number(prevAlloc.planningPeriod.workingHoursNorm);
      const prevYear = prevAlloc.planningPeriod.year;

      const rateCards = mapRateCards(prevAlloc.resource.rateCards);
      const rateCard = resolveRateCard(rateCards, prevYear, deliveryMonth);
      const cost = rateCard
        ? computeMonthlyCost({
            allocationPct: pct,
            rateCard,
            employmentType: "external",
            workingHoursNorm: hoursNorm,
          })
        : 0;

      ensureResource(prevAlloc.resourceId, prevAlloc.resource.name, prevAlloc.resource.employmentType, prevAlloc.resource.type);
      const existing = resourceMap.get(prevAlloc.resourceId)!.months[displayMonth];
      if (existing) {
        existing.cost += cost;
        existing.fte += pct;
        if (!rateCard) existing.missingRate = true;
      } else {
        resourceMap.get(prevAlloc.resourceId)!.months[displayMonth] = { cost, fte: pct, missingRate: !rateCard };
      }
    }
  }

  const rows = Array.from(resourceMap.values());

  // Monthly totals
  const monthTotals: Record<number, { cost: number; fte: number }> = {};
  for (let m = 1; m <= 12; m++) {
    monthTotals[m] = { cost: 0, fte: 0 };
    for (const row of rows) {
      monthTotals[m].cost += row.months[m]?.cost ?? 0;
      monthTotals[m].fte += row.months[m]?.fte ?? 0;
    }
  }

  const annualCost = Object.values(monthTotals).reduce((s, m) => s + m.cost, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teamrapport — {team?.name}</h1>
        <TeamReportFilters
          scenarios={scenarios.map((s) => ({ id: s.id, label: `${s.name} (${s.year})` }))}
          teams={teams.map((t) => ({ id: t.id, label: t.name }))}
          scenarioId={scenarioId}
          teamId={teamId}
        />
      </div>

      {offset > 0 && (
        <div className="rounded border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          Ekstern kostnadsforskyving: +{offset} mnd. — eksterne kostnader vises i bokføringsmåned.
          {hasPrev
            ? ` Desemberkostnad fra "${scenario?.prevScenario?.name}" er inkludert som januarkostnad.`
            : " Ingen forrige scenario er koblet — januarkostnaden for eksterne er tom."}
        </div>
      )}

      <div className="rounded border bg-white p-4 inline-block">
        <p className="text-xs text-gray-500 uppercase">Totalkostnad {team?.name}</p>
        <p className="text-2xl font-bold mt-1">{formatNok(annualCost)}</p>
      </div>

      <div className="rounded border bg-white">
        <table className="w-full text-xs">
          <thead className="border-b bg-gray-50 uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">Ressurs</th>
              <th className="px-2 py-2 text-left">Type</th>
              {MONTH_LABELS.map((label) => (
                <th key={label} className="px-1 py-2 text-right">{label}</th>
              ))}
              <th className="px-3 py-2 text-right">Årssum</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => {
              const annual = Object.values(row.months).reduce((s, m) => s + m.cost, 0);
              return (
                <tr key={row.name} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium whitespace-nowrap">
                    <a href={`/resources/${row.id}`} className="hover:underline text-blue-700">{row.name}</a>
                    {row.resourceType === "placeholder" && (
                      <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-700">
                        Placeholder
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-gray-600 whitespace-nowrap">
                    {row.employmentType === "internal" ? "Intern" : "Ekstern"}
                  </td>
                  {MONTH_LABELS.map((_, idx) => {
                    const m = idx + 1;
                    const entry = row.months[m];
                    return (
                      <td key={m} className="px-1 py-2 text-right tabular-nums">
                        {entry ? (
                          entry.missingRate ? (
                            <span
                              className="text-orange-600"
                              title={`${Math.round(entry.fte * 100)}% FTE — mangler ratekort, kostnad satt til kr 0`}
                            >
                              ⚠ 0
                            </span>
                          ) : (
                            <span title={`${Math.round(entry.fte * 100)}% FTE`}>
                              {formatNok(entry.cost)}
                            </span>
                          )
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right font-medium tabular-nums whitespace-nowrap">
                    {formatNok(annual)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 bg-gray-50 font-bold">
            <tr>
              <td className="px-3 py-2" colSpan={2}>Totalt</td>
              {MONTH_LABELS.map((_, idx) => {
                const m = idx + 1;
                return (
                  <td key={m} className="px-1 py-2 text-right tabular-nums">
                    {formatNok(monthTotals[m].cost)}
                  </td>
                );
              })}
              <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">{formatNok(annualCost)}</td>
            </tr>
          </tfoot>
        </table>
        <p className="px-4 py-2 text-right text-xs text-gray-400">Alle beløp i hele 1 000 kr</p>
      </div>
    </div>
  );
}
