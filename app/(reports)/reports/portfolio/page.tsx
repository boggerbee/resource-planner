import { prisma } from "@/lib/prisma";
import {
  computeMonthlyCost,
  computeMonthlyFTE,
  resolveRateCard,
} from "@/lib/domain/calculations";

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

export default async function PortfolioReportPage({
  searchParams,
}: {
  searchParams: Promise<{ scenarioId?: string }>;
}) {
  const params = await searchParams;
  const scenarios = await prisma.scenario.findMany({
    orderBy: [{ year: "desc" }, { name: "asc" }],
  });

  const scenarioId = params.scenarioId ?? scenarios[0]?.id;

  if (!scenarioId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Porteføljeoversikt</h1>
        <p className="text-gray-500">Ingen scenarioer funnet.</p>
      </div>
    );
  }

  const allocations = await prisma.allocation.findMany({
    where: { scenarioId },
    include: {
      resource: {
        include: {
          rateCards: true,
        },
      },
      planningPeriod: true,
      team: true,
    },
  });

  // Aggregate by month and employment type
  type MonthSummary = { internalCost: number; externalCost: number; internalFTE: number; externalFTE: number };
  const byMonth: Record<number, MonthSummary> = {};
  for (let m = 1; m <= 12; m++) {
    byMonth[m] = { internalCost: 0, externalCost: 0, internalFTE: 0, externalFTE: 0 };
  }

  for (const alloc of allocations) {
    const month = alloc.planningPeriod.month;
    const year = alloc.planningPeriod.year;
    const pct = Number(alloc.allocationPct);
    const hoursNorm = Number(alloc.planningPeriod.workingHoursNorm);
    const isInternal = alloc.resource.employmentType === "internal";

    const rateCards = alloc.resource.rateCards.map((rc) => ({
      ...rc,
      effectiveFrom: rc.effectiveFrom,
      effectiveTo: rc.effectiveTo,
      costBasis: rc.costBasis as "hourly" | "monthly",
      hourlyRateNok: rc.hourlyRateNok ? Number(rc.hourlyRateNok) : null,
      monthlyRateNok: rc.monthlyRateNok ? Number(rc.monthlyRateNok) : null,
      vatPct: rc.vatPct ? Number(rc.vatPct) : null,
      invoiceFactor: rc.invoiceFactor ? Number(rc.invoiceFactor) : null,
    }));

    const rateCard = resolveRateCard(rateCards, year, month);

    if (rateCard) {
      const cost = computeMonthlyCost({
        allocationPct: pct,
        rateCard: {
          costBasis: rateCard.costBasis,
          hourlyRateNok: rateCard.hourlyRateNok,
          monthlyRateNok: rateCard.monthlyRateNok,
          vatPct: rateCard.vatPct,
          invoiceFactor: rateCard.invoiceFactor,
        },
        employmentType: alloc.resource.employmentType as "internal" | "external",
        workingHoursNorm: hoursNorm,
      });

      if (isInternal) {
        byMonth[month].internalCost += cost;
        byMonth[month].internalFTE += pct;
      } else {
        byMonth[month].externalCost += cost;
        byMonth[month].externalFTE += pct;
      }
    } else {
      // No rate card — still count FTE
      if (isInternal) byMonth[month].internalFTE += pct;
      else byMonth[month].externalFTE += pct;
    }
  }

  const totalInternal = Object.values(byMonth).reduce((s, m) => s + m.internalCost, 0);
  const totalExternal = Object.values(byMonth).reduce((s, m) => s + m.externalCost, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Porteføljeoversikt</h1>
        <form className="flex gap-2">
          <select
            name="scenarioId"
            defaultValue={scenarioId}
            className="rounded border px-2 py-1 text-sm"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.year})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded bg-gray-800 px-3 py-1 text-sm text-white"
          >
            Vis
          </button>
        </form>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded border bg-white p-4">
          <p className="text-xs text-gray-500 uppercase">Intern totalkostnad</p>
          <p className="text-2xl font-bold mt-1">{formatNok(totalInternal)}</p>
        </div>
        <div className="rounded border bg-white p-4">
          <p className="text-xs text-gray-500 uppercase">Ekstern totalkostnad</p>
          <p className="text-2xl font-bold mt-1">{formatNok(totalExternal)}</p>
        </div>
        <div className="rounded border bg-white p-4">
          <p className="text-xs text-gray-500 uppercase">Totalt</p>
          <p className="text-2xl font-bold mt-1">
            {formatNok(totalInternal + totalExternal)}
          </p>
        </div>
      </div>

      {/* Monthly table */}
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Måned</th>
              <th className="px-4 py-3 text-right">Intern FTE</th>
              <th className="px-4 py-3 text-right">Intern kostnad</th>
              <th className="px-4 py-3 text-right">Ekstern FTE</th>
              <th className="px-4 py-3 text-right">Ekstern kostnad</th>
              <th className="px-4 py-3 text-right">Total FTE</th>
              <th className="px-4 py-3 text-right">Total kostnad</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {MONTH_LABELS.map((label, idx) => {
              const m = idx + 1;
              const row = byMonth[m];
              return (
                <tr key={m} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{label}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.internalFTE.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatNok(row.internalCost)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.externalFTE.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatNok(row.externalCost)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {(row.internalFTE + row.externalFTE).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatNok(row.internalCost + row.externalCost)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 bg-gray-50 font-bold">
            <tr>
              <td className="px-4 py-3">Årssum</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {Object.values(byMonth)
                  .reduce((s, m) => s + m.internalFTE, 0)
                  .toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatNok(totalInternal)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {Object.values(byMonth)
                  .reduce((s, m) => s + m.externalFTE, 0)
                  .toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatNok(totalExternal)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {Object.values(byMonth)
                  .reduce((s, m) => s + m.internalFTE + m.externalFTE, 0)
                  .toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatNok(totalInternal + totalExternal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
