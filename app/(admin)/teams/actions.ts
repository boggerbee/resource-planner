"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TeamSchema = z.object({
  name: z.string().min(1),
  projectCode: z.string().min(1),
  description: z.string().optional(),
  active: z.boolean().default(true),
  teamLeadId: z.string().optional(),
  konto: z.coerce.number().int().optional().nullable(),
  koststed: z.coerce.number().int().optional().nullable(),
  attestantId: z.string().optional().nullable(),
  godkjennerId: z.string().optional().nullable(),
});

export async function createTeam(formData: FormData) {
  const teamLeadId = formData.get("teamLeadId") as string | null;
  const attestantId = formData.get("attestantId") as string | null;
  const godkjennerId = formData.get("godkjennerId") as string | null;
  const parsed = TeamSchema.safeParse({
    name: formData.get("name"),
    projectCode: formData.get("projectCode"),
    description: formData.get("description") || undefined,
    active: true,
    teamLeadId: teamLeadId || undefined,
    konto: formData.get("konto") || undefined,
    koststed: formData.get("koststed") || undefined,
    attestantId: attestantId || null,
    godkjennerId: godkjennerId || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const team = await prisma.team.create({ data: parsed.data });
  const tagIds = formData.getAll("tagIds") as string[];
  if (tagIds.length > 0) {
    await prisma.teamTag.createMany({
      data: tagIds.map((tagId) => ({ teamId: team.id, tagId })),
    });
  }
  revalidatePath("/teams");
}

export async function updateTeam(id: string, formData: FormData) {
  const teamLeadId = formData.get("teamLeadId") as string | null;
  const attestantId = formData.get("attestantId") as string | null;
  const godkjennerId = formData.get("godkjennerId") as string | null;
  const parsed = TeamSchema.safeParse({
    name: formData.get("name"),
    projectCode: formData.get("projectCode"),
    description: formData.get("description") || undefined,
    active: formData.get("active") !== null,
    teamLeadId: teamLeadId || undefined,
    konto: formData.get("konto") || undefined,
    koststed: formData.get("koststed") || undefined,
    attestantId: attestantId || null,
    godkjennerId: godkjennerId || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.team.update({
    where: { id },
    data: {
      ...parsed.data,
      teamLeadId: teamLeadId || null,
      attestantId: attestantId || null,
      godkjennerId: godkjennerId || null,
    },
  });
  const tagIds = formData.getAll("tagIds") as string[];
  await prisma.teamTag.deleteMany({ where: { teamId: id } });
  if (tagIds.length > 0) {
    await prisma.teamTag.createMany({
      data: tagIds.map((tagId) => ({ teamId: id, tagId })),
    });
  }
  revalidatePath("/teams");
}

export async function deleteTeam(id: string) {
  await prisma.allocation.deleteMany({ where: { teamId: id } });
  await prisma.otherCost.deleteMany({ where: { teamId: id } });
  await prisma.team.delete({ where: { id } });
  revalidatePath("/teams");
}
