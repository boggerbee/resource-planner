import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ScenarioSelect } from "./scenario-select";

export default async function TeamsReportPage({
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
        <h1 className="text-2xl font-bold">Teamoversikt</h1>
        <p className="text-gray-500">Ingen scenarioer funnet.</p>
      </div>
    );
  }

  const teams = await prisma.team.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: { tags: { include: { tag: true } } },
  });

  const allocations = await prisma.allocation.findMany({
    where: { scenarioId },
    include: {
      resource: true,
      planningPeriod: true,
    },
  });

  // Compute avg FTE per resource per team
  type TeamStats = { internFTE: number; eksternFTE: number };
  const teamStats: Record<string, TeamStats> = {};

  for (const team of teams) {
    teamStats[team.id] = { internFTE: 0, eksternFTE: 0 };

    const teamAllocs = allocations.filter((a) => a.teamId === team.id);
    const resourceIds = [...new Set(teamAllocs.map((a) => a.resourceId))];

    for (const resourceId of resourceIds) {
      const resAllocs = teamAllocs.filter((a) => a.resourceId === resourceId);
      const months = [...new Set(resAllocs.map((a) => a.planningPeriod.month))];
      const totalPct = resAllocs.reduce((s, a) => s + Number(a.allocationPct), 0);
      const avgFTE = months.length > 0 ? totalPct / months.length : 0;

      const isInternal = resAllocs[0]?.resource.employmentType === "internal";
      if (isInternal) {
        teamStats[team.id].internFTE += avgFTE;
      } else {
        teamStats[team.id].eksternFTE += avgFTE;
      }
    }
  }

  const maxFTE = Math.max(
    ...teams.map((t) => teamStats[t.id].internFTE + teamStats[t.id].eksternFTE),
    1
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teamoversikt</h1>
        <ScenarioSelect scenarios={scenarios} value={scenarioId} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => {
          const { internFTE, eksternFTE } = teamStats[team.id];
          const totalFTE = internFTE + eksternFTE;
          const barWidth = totalFTE > 0 ? (totalFTE / maxFTE) * 100 : 0;
          const internShare = totalFTE > 0 ? (internFTE / totalFTE) * 100 : 0;
          const eksternShare = totalFTE > 0 ? (eksternFTE / totalFTE) * 100 : 0;

          return (
            <Link
              key={team.id}
              href={`/allocations?scenarioId=${scenarioId}&teamId=${team.id}`}
              className="rounded border bg-white p-4 space-y-3 block hover:border-gray-400 hover:shadow-sm transition-shadow"
            >
              <div>
                <p className="text-lg font-semibold leading-tight">{team.name}</p>
                {team.projectCode && (
                  <p className="text-xs text-gray-400">{team.projectCode}</p>
                )}
                {team.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {team.tags.map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        style={
                          tag.color
                            ? { backgroundColor: tag.color + "33", color: tag.color }
                            : { backgroundColor: "#e5e7eb", color: "#374151" }
                        }
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-3xl font-bold tabular-nums">{totalFTE.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-0.5">FTE totalt</p>
              </div>

              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500" />
                  <span className="text-gray-600">Intern</span>
                  <span className="font-semibold tabular-nums">{internFTE.toFixed(1)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-400" />
                  <span className="text-gray-600">Ekstern</span>
                  <span className="font-semibold tabular-nums">{eksternFTE.toFixed(1)}</span>
                </span>
              </div>

              <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full flex rounded-full overflow-hidden"
                  style={{ width: `${barWidth}%` }}
                >
                  <div className="bg-blue-500 h-full" style={{ width: `${internShare}%` }} />
                  <div className="bg-orange-400 h-full" style={{ width: `${eksternShare}%` }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {teams.length === 0 && (
        <p className="text-gray-400">Ingen aktive team funnet.</p>
      )}
    </div>
  );
}
