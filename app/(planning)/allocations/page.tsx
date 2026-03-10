import { prisma } from "@/lib/prisma";
import { AllocationGrid } from "./allocation-grid";

export default async function AllocationsPage({
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
        <h1 className="text-2xl font-bold">Allokeringer</h1>
        <p className="text-gray-500">
          Opprett minst ett scenario og ett team for å registrere allokeringer.
        </p>
      </div>
    );
  }

  const [allocations, periods] = await Promise.all([
    prisma.allocation.findMany({
      where: { scenarioId, teamId },
      include: {
        resource: { include: { company: true } },
        planningPeriod: true,
      },
    }),
    prisma.planningPeriod.findMany({
      where: { scenarioId },
      orderBy: { month: "asc" },
    }),
  ]);

  // Build resource × month grid
  const resourceMap = new Map<
    string,
    { resource: (typeof allocations)[0]["resource"]; months: Record<number, number> }
  >();

  for (const alloc of allocations) {
    const existing = resourceMap.get(alloc.resourceId);
    const pct = Number(alloc.allocationPct);
    if (existing) {
      existing.months[alloc.planningPeriod.month] = pct;
    } else {
      resourceMap.set(alloc.resourceId, {
        resource: alloc.resource,
        months: { [alloc.planningPeriod.month]: pct },
      });
    }
  }

  // Detect overbooking per resource per month in this scenario
  const allAllocsInScenario = await prisma.allocation.findMany({
    where: { scenarioId },
    include: { planningPeriod: true },
  });

  const overbookedKeys = new Set<string>();
  const resourceMonthTotals = new Map<string, number>();
  for (const a of allAllocsInScenario) {
    const key = `${a.resourceId}-${a.planningPeriod.month}`;
    resourceMonthTotals.set(
      key,
      (resourceMonthTotals.get(key) ?? 0) + Number(a.allocationPct)
    );
  }
  for (const [key, total] of resourceMonthTotals) {
    if (total > 1.0) overbookedKeys.add(key);
  }

  const gridData = Array.from(resourceMap.values());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Allokeringer</h1>
      </div>

      {/* Filters */}
      <form className="flex gap-4 rounded border bg-white p-4">
        <div>
          <label className="block text-xs font-medium text-gray-500">Scenario</label>
          <select
            name="scenarioId"
            defaultValue={scenarioId}
            className="mt-1 rounded border px-2 py-1 text-sm"
            onChange={undefined}
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.year})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Team</label>
          <select
            name="teamId"
            defaultValue={teamId}
            className="mt-1 rounded border px-2 py-1 text-sm"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="rounded bg-gray-800 px-3 py-1 text-sm text-white hover:bg-gray-700"
          >
            Filtrer
          </button>
        </div>
      </form>

      <AllocationGrid
        gridData={gridData}
        periods={periods}
        overbookedKeys={overbookedKeys}
        scenarioId={scenarioId}
        teamId={teamId}
      />
    </div>
  );
}
