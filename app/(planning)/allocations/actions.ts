"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function assertNotApproved(scenarioId: string) {
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    select: { status: true },
  });
  if (scenario?.status === "approved" || scenario?.status === "archived") {
    throw new Error("Godkjente og arkiverte scenarier kan ikke endres.");
  }
}

export async function upsertAllocations(
  scenarioId: string,
  teamId: string,
  resourceId: string,
  /** months[0] = januar (1-indexed key), value 0–100 as percent */
  monthValues: Record<number, number>
) {
  await assertNotApproved(scenarioId);

  // Fetch all planning periods for this scenario
  const periods = await prisma.planningPeriod.findMany({
    where: { scenarioId },
  });

  const periodByMonth = new Map(periods.map((p) => [p.month, p.id]));

  for (let month = 1; month <= 12; month++) {
    const pct = monthValues[month] ?? 0;
    const planningPeriodId = periodByMonth.get(month);

    if (!planningPeriodId) continue;

    if (pct <= 0) {
      // Remove allocation if it exists
      await prisma.allocation.deleteMany({
        where: { scenarioId, teamId, resourceId, planningPeriodId },
      });
    } else {
      await prisma.allocation.upsert({
        where: {
          scenarioId_teamId_resourceId_planningPeriodId: {
            scenarioId,
            teamId,
            resourceId,
            planningPeriodId,
          },
        },
        create: {
          scenarioId,
          teamId,
          resourceId,
          planningPeriodId,
          allocationPct: pct / 100,
        },
        update: { allocationPct: pct / 100 },
      });
    }
  }

  revalidatePath("/allocations");
}

export async function removeResourceFromTeam(
  scenarioId: string,
  teamId: string,
  resourceId: string
) {
  await assertNotApproved(scenarioId);
  await prisma.allocation.deleteMany({
    where: { scenarioId, teamId, resourceId },
  });
  revalidatePath("/allocations");
}
