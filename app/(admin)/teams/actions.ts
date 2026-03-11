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
});

export async function createTeam(formData: FormData) {
  const teamLeadId = formData.get("teamLeadId") as string | null;
  const parsed = TeamSchema.safeParse({
    name: formData.get("name"),
    projectCode: formData.get("projectCode"),
    description: formData.get("description") || undefined,
    active: true,
    teamLeadId: teamLeadId || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.team.create({ data: parsed.data });
  revalidatePath("/teams");
}

export async function updateTeam(id: string, formData: FormData) {
  const teamLeadId = formData.get("teamLeadId") as string | null;
  const parsed = TeamSchema.safeParse({
    name: formData.get("name"),
    projectCode: formData.get("projectCode"),
    description: formData.get("description") || undefined,
    active: formData.get("active") !== null,
    teamLeadId: teamLeadId || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.team.update({
    where: { id },
    data: { ...parsed.data, teamLeadId: teamLeadId || null },
  });
  revalidatePath("/teams");
}

export async function deleteTeam(id: string) {
  await prisma.allocation.deleteMany({ where: { teamId: id } });
  await prisma.otherCost.deleteMany({ where: { teamId: id } });
  await prisma.team.delete({ where: { id } });
  revalidatePath("/teams");
}
