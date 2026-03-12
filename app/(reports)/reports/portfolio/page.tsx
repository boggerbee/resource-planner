import React from "react";
import { prisma } from "@/lib/prisma";
import {
  computeMonthlyCost,
  resolveRateCard,
} from "@/lib/domain/calculations";

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
      resource: { include: { rateCards: true } },
      planningPeriod: true,
      team: { include: { tags: { include: { tag: true } } } },
    },
  });

  // Aggregate annual cost per team, split intern/ekstern
  type TeamCost = { internalCost: number; externalCost: number; name: string; projectCode: string };
  const byTeam = new Map<string, TeamCost>();

  // Also track portfolio-level totals (for summary cards)
  let totalInternal = 0;
  let totalExternal = 0;

  for (const alloc of allocations) {
    const { month, year, workingHoursNorm } = alloc.planningPeriod;
    const pct = Number(alloc.allocationPct);
    const hoursNorm = Number(workingHoursNorm);
    const isInternal = alloc.resource.employmentType === "internal";

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
          rateCard: {
            costBasis: rateCard.costBasis,
            hourlyRateNok: rateCard.hourlyRateNok,
            monthlyRateNok: rateCard.monthlyRateNok,
            vatPct: rateCard.vatPct,
            invoiceFactor: rateCard.invoiceFactor,
          },
          employmentType: alloc.resource.employmentType as "internal" | "external",
          workingHoursNorm: hoursNorm,
        })
      : 0;

    if (!byTeam.has(alloc.teamId)) {
      byTeam.set(alloc.teamId, {
        internalCost: 0,
        externalCost: 0,
        name: alloc.team.name,
        projectCode: alloc.team.projectCode,
      });
    }
    const entry = byTeam.get(alloc.teamId)!;
    if (isInternal) {
      entry.internalCost += cost;
      totalInternal += cost;
    } else {
      entry.externalCost += cost;
      totalExternal += cost;
    }
  }

  // Build tag groups — each team goes under its first tag (alphabetically), or "untagged"
  // We need team→tags mapping from allocations' team data
  const teamTagMap = new Map<string, { id: string; name: string; color: string | null }[]>();
  for (const alloc of allocations) {
    if (!teamTagMap.has(alloc.teamId)) {
      const sorted = alloc.team.tags
        .map((tt) => tt.tag)
        .sort((a, b) => a.name.localeCompare(b.name));
      teamTagMap.set(alloc.teamId, sorted);
    }
  }

  type TagInfo = { id: string; name: string; color: string | null };
  const tagGroups = new Map<string, { tag: TagInfo; teamIds: string[] }>();
  const untaggedTeamIds: string[] = [];

  for (const [teamId] of byTeam) {
    const tags = teamTagMap.get(teamId) ?? [];
    if (tags.length === 0) {
      untaggedTeamIds.push(teamId);
    } else {
      const primaryTag = tags[0];
      if (!tagGroups.has(primaryTag.id)) {
        tagGroups.set(primaryTag.id, { tag: primaryTag, teamIds: [] });
      }
      tagGroups.get(primaryTag.id)!.teamIds.push(teamId);
    }
  }

  const sortedGroups = Array.from(tagGroups.values()).sort((a, b) =>
    a.tag.name.localeCompare(b.tag.name)
  );

  function TeamRow({ teamId }: { teamId: string }) {
    const team = byTeam.get(teamId)!;
    return (
      <tr className="hover:bg-gray-50">
        <td className="py-2.5 pl-8 pr-4 text-sm">
          <span className="font-medium">{team.name}</span>
          <span className="ml-2 text-xs text-gray-400">{team.projectCode}</span>
        </td>
        <td className="px-4 py-2.5 text-right tabular-nums text-sm">
          {formatNok(team.internalCost)}
        </td>
        <td className="px-4 py-2.5 text-right tabular-nums text-sm">
          {formatNok(team.externalCost)}
        </td>
        <td className="px-4 py-2.5 text-right tabular-nums text-sm font-medium">
          {formatNok(team.internalCost + team.externalCost)}
        </td>
      </tr>
    );
  }


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
          <p className="text-2xl font-bold mt-1">{formatNok(totalInternal + totalExternal)}</p>
        </div>
      </div>

      {/* Per-team costs grouped by tag */}
      <div className="rounded border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Team</th>
              <th className="px-4 py-3 text-right">Intern</th>
              <th className="px-4 py-3 text-right">Ekstern</th>
              <th className="px-4 py-3 text-right">Totalt</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedGroups.map(({ tag, teamIds }) => {
              const intCost = teamIds.reduce((s, id) => s + (byTeam.get(id)?.internalCost ?? 0), 0);
              const extCost = teamIds.reduce((s, id) => s + (byTeam.get(id)?.externalCost ?? 0), 0);
              return (
                <React.Fragment key={tag.id}>
                  <tr className="bg-gray-50">
                    <td
                      className="px-4 py-2 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: tag.color ?? "#374151" }}
                    >
                      <span
                        className="mr-2 inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: tag.color ?? "#9ca3af" }}
                      />
                      {tag.name}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-sm font-bold text-gray-700">{formatNok(intCost)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-sm font-bold text-gray-700">{formatNok(extCost)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-sm font-bold text-gray-700">{formatNok(intCost + extCost)}</td>
                  </tr>
                  {teamIds.map((teamId) => (
                    <TeamRow key={teamId} teamId={teamId} />
                  ))}
                </React.Fragment>
              );
            })}

            {untaggedTeamIds.length > 0 && (() => {
              const intCost = untaggedTeamIds.reduce((s, id) => s + (byTeam.get(id)?.internalCost ?? 0), 0);
              const extCost = untaggedTeamIds.reduce((s, id) => s + (byTeam.get(id)?.externalCost ?? 0), 0);
              return (
                <>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Uten merkelapp</td>
                    <td className="px-4 py-2 text-right tabular-nums text-sm font-bold text-gray-500">{formatNok(intCost)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-sm font-bold text-gray-500">{formatNok(extCost)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-sm font-bold text-gray-500">{formatNok(intCost + extCost)}</td>
                  </tr>
                  {untaggedTeamIds.map((teamId) => (
                    <TeamRow key={teamId} teamId={teamId} />
                  ))}
                </>
              );
            })()}
          </tbody>
          <tfoot className="border-t-2 bg-gray-50">
            <tr className="font-bold">
              <td className="px-4 py-3">Total portefølje</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatNok(totalInternal)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatNok(totalExternal)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatNok(totalInternal + totalExternal)}</td>
            </tr>
          </tfoot>
        </table>
        {byTeam.size === 0 && (
          <p className="px-4 py-8 text-center text-gray-400">
            Ingen allokeringer funnet for dette scenariet.
          </p>
        )}
      </div>
    </div>
  );
}
