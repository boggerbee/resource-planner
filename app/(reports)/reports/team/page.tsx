import { prisma } from "@/lib/prisma";
import { computeMonthlyCost, resolveRateCard } from "@/lib/domain/calculations";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Des",
];

function formatNok(amount: number) {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(amount);
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

  const allocations = await prisma.allocation.findMany({
    where: { scenarioId, teamId },
    include: {
      resource: { include: { rateCards: true } },
      planningPeriod: true,
    },
    orderBy: [{ planningPeriod: { month: "asc" } }, { resource: { name: "asc" } }],
  });

  // Build month × resource cost+fte table
  type ResourceMonth = { name: string; employmentType: string; months: Record<number, { cost: number; fte: number }> };
  const resourceMap = new Map<string, ResourceMonth>();

  for (const alloc of allocations) {
    const month = alloc.planningPeriod.month;
    const year = alloc.planningPeriod.year;
    const pct = Number(alloc.allocationPct);
    const hoursNorm = Number(alloc.planningPeriod.workingHoursNorm);

    const rateCards = alloc.resource.rateCards.map((rc) => ({
      ...rc,
      costBasis: rc.costBasis as "hourly" | "monthly",
      hourlyRateNok: rc.hourlyRateNok ? Number(rc.hourlyRateNok) : null,
      monthlyRateNok: rc.monthlyRateNok ? Number(rc.monthlyRateNok) : null,
      vatPct: rc.vatPct ? Number(rc.vatPct) : null,
      invoiceFactor: rc.invoiceFactor ? Number(rc.invoiceFactor) : null,
    }));

    const rateCard = resolveRateCard(rateCards, year, month);
    const cost = rateCard
      ? computeMonthlyCost({
          allocationPct: pct,
          rateCard,
          employmentType: alloc.resource.employmentType as "internal" | "external",
          workingHoursNorm: hoursNorm,
        })
      : 0;

    if (!resourceMap.has(alloc.resourceId)) {
      resourceMap.set(alloc.resourceId, {
        name: alloc.resource.name,
        employmentType: alloc.resource.employmentType,
        months: {},
      });
    }
    const rm = resourceMap.get(alloc.resourceId)!;
    rm.months[month] = { cost, fte: pct };
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

      <div className="rounded border bg-white p-4 inline-block">
        <p className="text-xs text-gray-500 uppercase">Totalkostnad {team?.name}</p>
        <p className="text-2xl font-bold mt-1">{formatNok(annualCost)}</p>
      </div>

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Ressurs</th>
              <th className="px-4 py-3 text-left">Type</th>
              {MONTH_LABELS.map((label) => (
                <th key={label} className="px-2 py-3 text-right w-20">{label}</th>
              ))}
              <th className="px-4 py-3 text-right">Årssum</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => {
              const annual = Object.values(row.months).reduce((s, m) => s + m.cost, 0);
              return (
                <tr key={row.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.employmentType === "internal" ? "Intern" : "Ekstern"}
                  </td>
                  {MONTH_LABELS.map((_, idx) => {
                    const m = idx + 1;
                    const entry = row.months[m];
                    return (
                      <td key={m} className="px-2 py-3 text-right tabular-nums text-xs">
                        {entry ? (
                          <span title={`${Math.round(entry.fte * 100)}% FTE`}>
                            {formatNok(entry.cost)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatNok(annual)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 bg-gray-50 font-bold">
            <tr>
              <td className="px-4 py-3" colSpan={2}>Totalt</td>
              {MONTH_LABELS.map((_, idx) => {
                const m = idx + 1;
                return (
                  <td key={m} className="px-2 py-3 text-right tabular-nums text-xs">
                    {formatNok(monthTotals[m].cost)}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-right tabular-nums">{formatNok(annualCost)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
