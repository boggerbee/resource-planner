import { prisma } from "@/lib/prisma";
import { AllocationFilters } from "./allocation-filters";
import { AllocationGrid } from "./allocation-grid";

export default async function AllocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ scenarioId?: string; teamId?: string; onlyEditable?: string }>;
}) {
  const params = await searchParams;

  const [scenarios, teams] = await Promise.all([
    prisma.scenario.findMany({
      orderBy: [{ year: "desc" }, { name: "asc" }],
      select: { id: true, name: true, year: true, status: true },
    }),
    prisma.team.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const onlyEditable = params.onlyEditable === "1";
  const editableScenarios = onlyEditable ? scenarios.filter((s) => s.status === "draft") : scenarios;
  const scenarioId = params.scenarioId ?? editableScenarios[0]?.id ?? scenarios[0]?.id;
  const teamId = params.teamId ?? teams[0]?.id;
  const selectedScenario = scenarios.find((s) => s.id === scenarioId);
  const readOnly = selectedScenario?.status === "approved" || selectedScenario?.status === "archived";

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

  const [allocations, periods, allResources] = await Promise.all([
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
    prisma.resource.findMany({
      include: { company: true },
      orderBy: { name: "asc" },
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

  const allocatedResourceIds = new Set(gridData.map((d) => d.resource.id));
  const availableResources = allResources
    .filter((r) => !allocatedResourceIds.has(r.id))
    .map((r) => ({
      id: r.id,
      name: r.name,
      employmentType: r.employmentType,
      type: r.type,
      company: { name: r.company.name },
    }));

  // Serialize Decimal fields before passing to Client Component
  const serializedPeriods = periods.map((p) => ({
    ...p,
    workingHoursNorm: Number(p.workingHoursNorm),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Allokeringer</h1>
      </div>

      {readOnly && (
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Dette scenariet er {selectedScenario?.status === "approved" ? "godkjent" : "arkivert"} og kan ikke endres. Opprett en kopi for å gjøre endringer.
        </div>
      )}

      <AllocationFilters
        scenarios={scenarios}
        teams={teams}
        scenarioId={scenarioId}
        teamId={teamId}
        onlyEditable={onlyEditable}
      />

      <AllocationGrid
        gridData={gridData}
        periods={serializedPeriods}
        overbookedKeys={overbookedKeys}
        scenarioId={scenarioId}
        teamId={teamId}
        availableResources={availableResources}
        readOnly={readOnly}
      />
    </div>
  );
}
