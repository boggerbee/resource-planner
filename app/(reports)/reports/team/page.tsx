import { prisma } from "@/lib/prisma";
import { computeMonthlyCost, resolveRateCard } from "@/lib/domain/calculations";

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
  const [scenarios, teams] = await Promise.all([
    prisma.scenario.findMany({ orderBy: [{ year: "desc" }, { name: "asc" }] }),
    prisma.team.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const scenarioId = params.scenarioId ?? scenarios[0]?.id;
  const teamId = params.teamId ?? teams[0]?.id;

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
  type ResourceMonth = { id: string; name: string; employmentType: string; months: Record<number, { cost: number; fte: number; missingRate: boolean }> };
  const resourceMap = new Map<string, ResourceMonth>();

  function ensureResource(id: string, name: string, employmentType: string) {
    if (!resourceMap.has(id)) {
      resourceMap.set(id, { id, name, employmentType, months: {} });
    }
  }

  // Current scenario allocations — apply offset for external resources
  for (const alloc of allocations) {
    const deliveryMonth = alloc.planningPeriod.month;
    const year = alloc.planningPeriod.year;
    const pct = Number(alloc.allocationPct);
    const hoursNorm = Number(alloc.planningPeriod.workingHoursNorm);
    const isExternal = alloc.resource.employmentType === "external";

    // With offset > 0, exclude external deliveries in the last `offset` months (same as portfolio report)
    if (isExternal && offset > 0 && deliveryMonth > 12 - offset) continue;

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

    ensureResource(alloc.resourceId, alloc.resource.name, alloc.resource.employmentType);
    resourceMap.get(alloc.resourceId)!.months[deliveryMonth] = {
      cost,
      fte: pct,
      missingRate: !rateCard,
    };
  }

  // Carry-over: December allocations from prevScenario → January of this year
  if (offset > 0 && scenario?.prevScenario) {
    for (const prevAlloc of scenario.prevScenario.allocations) {
      if (prevAlloc.planningPeriod.month !== 12) continue;
      if (prevAlloc.resource.employmentType !== "external") continue;

      const pct = Number(prevAlloc.allocationPct);
      const hoursNorm = Number(prevAlloc.planningPeriod.workingHoursNorm);
      const prevYear = prevAlloc.planningPeriod.year;

      const rateCards = mapRateCards(prevAlloc.resource.rateCards);
      const rateCard = resolveRateCard(rateCards, prevYear, 12);
      const cost = rateCard
        ? computeMonthlyCost({
            allocationPct: pct,
            rateCard,
            employmentType: "external",
            workingHoursNorm: hoursNorm,
          })
        : 0;

      ensureResource(prevAlloc.resourceId, prevAlloc.resource.name, prevAlloc.resource.employmentType);
      // bookingMonth = 1 (January): December delivery from prev year → January booking
      const existing = resourceMap.get(prevAlloc.resourceId)!.months[1];
      if (existing) {
        existing.cost += cost;
        existing.fte += pct;
        if (!rateCard) existing.missingRate = true;
      } else {
        resourceMap.get(prevAlloc.resourceId)!.months[1] = { cost, fte: pct, missingRate: !rateCard };
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
        <form className="flex gap-2">
          <select name="scenarioId" defaultValue={scenarioId} className="rounded border px-2 py-1 text-sm">
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.year})</option>
            ))}
          </select>
          <select name="teamId" defaultValue={teamId} className="rounded border px-2 py-1 text-sm">
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button type="submit" className="rounded bg-gray-800 px-3 py-1 text-sm text-white">Vis</button>
        </form>
      </div>

      {offset > 0 && (
        <div className="rounded border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          Ekstern kostnadsforskyving: +{offset} mnd. — eksterne kostnader vises i bokföringsmåned.
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
      </div>
    </div>
  );
}
