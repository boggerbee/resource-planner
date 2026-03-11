"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CompanySchema = z.object({
  name: z.string().min(1),
  companyTypeId: z.string().min(1),
  isInternalCompany: z.boolean().default(false),
  active: z.boolean().default(true),
});

export async function createCompany(formData: FormData) {
  const parsed = CompanySchema.safeParse({
    name: formData.get("name"),
    companyTypeId: formData.get("companyTypeId"),
    isInternalCompany: formData.get("isInternalCompany") !== null,
    active: true,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const company = await prisma.company.create({ data: parsed.data });
  revalidatePath("/companies");
  return { id: company.id };
}

export async function updateCompany(id: string, formData: FormData) {
  const parsed = CompanySchema.safeParse({
    name: formData.get("name"),
    companyTypeId: formData.get("companyTypeId"),
    isInternalCompany: formData.get("isInternalCompany") !== null,
    active: formData.get("active") !== null,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.company.update({ where: { id }, data: parsed.data });
  revalidatePath("/companies");
}

export async function deleteCompany(id: string) {
  const resourceCount = await prisma.resource.count({ where: { companyId: id } });
  if (resourceCount > 0) {
    return { error: `Kan ikke slette: ${resourceCount} ressurs${resourceCount !== 1 ? "er er" : " er"} knyttet til dette firmaet.` };
  }
  await prisma.company.delete({ where: { id } });
  revalidatePath("/companies");
}
