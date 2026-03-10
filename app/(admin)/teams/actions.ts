"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TeamSchema = z.object({
  name: z.string().min(1),
  projectCode: z.string().min(1),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

export async function createTeam(formData: FormData) {
  const parsed = TeamSchema.safeParse({
    name: formData.get("name"),
    projectCode: formData.get("projectCode"),
    description: formData.get("description") || undefined,
    active: true,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.team.create({ data: parsed.data });
  revalidatePath("/teams");
}

export async function updateTeam(id: string, formData: FormData) {
  const parsed = TeamSchema.safeParse({
    name: formData.get("name"),
    projectCode: formData.get("projectCode"),
    description: formData.get("description") || undefined,
    // checkbox sends "true" when checked, nothing when unchecked
    active: formData.get("active") !== null,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.team.update({ where: { id }, data: parsed.data });
  revalidatePath("/teams");
}

export async function deleteTeam(id: string) {
  await prisma.allocation.deleteMany({ where: { teamId: id } });
  await prisma.otherCost.deleteMany({ where: { teamId: id } });
  await prisma.team.delete({ where: { id } });
  revalidatePath("/teams");
}
