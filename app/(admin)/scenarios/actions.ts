"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ScenarioSchema = z.object({
  name: z.string().min(1),
  year: z.coerce.number().int().min(2020).max(2099),
  status: z.enum(["draft", "approved", "archived"]),
  description: z.string().optional(),
  externalCostOffsetMonths: z.coerce.number().int().min(0).max(12).default(0),
  prevScenarioId: z.string().optional().nullable(),
});

export async function createScenario(formData: FormData) {
  const parsed = ScenarioSchema.safeParse({
    name: formData.get("name"),
    year: formData.get("year"),
    status: formData.get("status"),
    description: formData.get("description") || undefined,
    externalCostOffsetMonths: formData.get("externalCostOffsetMonths") || 0,
    prevScenarioId: formData.get("prevScenarioId") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { name, year, status, description, externalCostOffsetMonths, prevScenarioId } = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (status === "approved") {
      await tx.scenario.updateMany({
        where: { year, status: "approved" },
        data: { status: "archived" },
      });
    }
    await tx.scenario.create({
      data: {
        name,
        year,
        status,
        description,
        externalCostOffsetMonths,
        prevScenarioId: prevScenarioId || null,
        planningPeriods: {
          create: Array.from({ length: 12 }, (_, i) => ({
            year,
            month: i + 1,
            workingHoursNorm: 162,
          })),
        },
      },
    });
  });

  revalidatePath("/scenarios");
}

export async function updateScenario(id: string, formData: FormData) {
  const parsed = ScenarioSchema.safeParse({
    name: formData.get("name"),
    year: formData.get("year"),
    status: formData.get("status"),
    description: formData.get("description") || undefined,
    externalCostOffsetMonths: formData.get("externalCostOffsetMonths") || 0,
    prevScenarioId: formData.get("prevScenarioId") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { name, year, status, description, externalCostOffsetMonths, prevScenarioId } = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (status === "approved") {
      await tx.scenario.updateMany({
        where: { year, status: "approved", id: { not: id } },
        data: { status: "archived" },
      });
    }
    await tx.scenario.update({
      where: { id },
      data: { name, year, status, description, externalCostOffsetMonths, prevScenarioId: prevScenarioId || null },
    });
  });

  revalidatePath("/scenarios");
}

export async function approveScenario(id: string) {
  const scenario = await prisma.scenario.findUniqueOrThrow({ where: { id } });
  await prisma.$transaction([
    prisma.scenario.updateMany({
      where: { year: scenario.year, status: "approved", id: { not: id } },
      data: { status: "archived" },
    }),
    prisma.scenario.update({ where: { id }, data: { status: "approved" } }),
  ]);
  revalidatePath("/scenarios");
}

const CopySchema = z.object({
  name: z.string().min(1),
  year: z.coerce.number().int().min(2020).max(2099),
});

export async function copyScenario(
  sourceId: string,
  formData: FormData
): Promise<{ newId?: string; error?: string }> {
  const parsed = CopySchema.safeParse({
    name: formData.get("name"),
    year: formData.get("year"),
  });

  if (!parsed.success) {
    return { error: "Ugyldig navn eller år." };
  }

  const { name, year } = parsed.data;

  const source = await prisma.scenario.findUnique({
    where: { id: sourceId },
    include: {
      planningPeriods: true,
      allocations: true,
    },
  });

  if (!source) return { error: "Kildescenario ikke funnet." };

  const newScenario = await prisma.$transaction(async (tx) => {
    const created = await tx.scenario.create({
      data: {
        name,
        year,
        status: "draft",
        description: source.description ?? undefined,
        externalCostOffsetMonths: source.externalCostOffsetMonths,
        prevScenarioId: source.prevScenarioId ?? null,
      },
    });

    // Create planning periods and build old->new id map
    const periodIdMap = new Map<string, string>();
    for (const period of source.planningPeriods) {
      const newPeriod = await tx.planningPeriod.create({
        data: {
          scenarioId: created.id,
          year,
          month: period.month,
          workingHoursNorm: period.workingHoursNorm,
        },
      });
      periodIdMap.set(period.id, newPeriod.id);
    }

    // Copy allocations
    if (source.allocations.length > 0) {
      await tx.allocation.createMany({
        data: source.allocations.map((a) => ({
          scenarioId: created.id,
          teamId: a.teamId,
          resourceId: a.resourceId,
          planningPeriodId: periodIdMap.get(a.planningPeriodId)!,
          allocationPct: a.allocationPct,
          notes: a.notes ?? undefined,
        })),
      });
    }

    return created;
  });

  revalidatePath("/scenarios");
  return { newId: newScenario.id };
}

export async function deleteScenario(id: string) {
  const scenario = await prisma.scenario.findUnique({
    where: { id },
    include: { _count: { select: { allocations: true } } },
  });

  if (!scenario) return { error: "Scenario ikke funnet" };

  if (scenario._count.allocations > 0) {
    return {
      error: `Kan ikke slette: scenarioet har ${scenario._count.allocations} allokering(er).`,
    };
  }

  await prisma.scenario.delete({ where: { id } });
  revalidatePath("/scenarios");
}
