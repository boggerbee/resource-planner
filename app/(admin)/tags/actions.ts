"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

const TagSchema = z.object({
  name: z.string().min(1),
  color: z
    .string()
    .optional()
    .refine((v) => !v || hexColorRegex.test(v), {
      message: "Farge må være en gyldig hex-verdi, f.eks. #3b82f6",
    }),
});

export async function createTag(formData: FormData) {
  const parsed = TagSchema.safeParse({
    name: formData.get("name"),
    color: (formData.get("color") as string) || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.tag.create({ data: parsed.data });
  revalidatePath("/tags");
}

export async function updateTag(id: string, formData: FormData) {
  const parsed = TagSchema.safeParse({
    name: formData.get("name"),
    color: (formData.get("color") as string) || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.tag.update({ where: { id }, data: parsed.data });
  revalidatePath("/tags");
}

export async function deleteTag(id: string) {
  await prisma.tag.delete({ where: { id } });
  revalidatePath("/tags");
  revalidatePath("/teams");
}
