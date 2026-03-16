"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ResourceSchema = z.object({
  name: z.string().min(1, "Navn er påkrevd"),
  type: z.enum(["person", "placeholder"]),
  employmentType: z.enum(["internal", "external"]),
  companyId: z.string().min(1, "Firma er påkrevd"),
  primaryRole: z.string().optional(),
  department: z.string().optional(),
  activeFrom: z.string().optional().nullable(),
  activeTo: z.string().optional().nullable(),
  notes: z.string().optional(),
});

const RateCardSchema = z.object({
  hourlyRateNok: z.coerce.number().positive().optional(),
  invoiceFactor: z.coerce.number().min(0).max(2).default(1.0),
  vatPct: z.coerce.number().min(0).max(1).optional(),
  effectiveFrom: z.string().min(1),
});

export async function createResource(formData: FormData) {
  const parsed = ResourceSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    employmentType: formData.get("employmentType"),
    companyId: formData.get("companyId"),
    primaryRole: formData.get("primaryRole") || undefined,
    department: formData.get("department") || undefined,
    activeFrom: formData.get("activeFrom") || null,
    activeTo: formData.get("activeTo") || null,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { activeFrom, activeTo, ...rest } = parsed.data;
  const resource = await prisma.resource.create({
    data: {
      ...rest,
      activeFrom: activeFrom ? new Date(activeFrom) : null,
      activeTo: activeTo ? new Date(activeTo) : null,
    },
  });

  const rateRaw = formData.get("hourlyRateNok");
  if (rateRaw) {
    const rateParsed = RateCardSchema.safeParse({
      hourlyRateNok: rateRaw,
      invoiceFactor: formData.get("invoiceFactor") || 1.0,
      vatPct: formData.get("vatPct") || undefined,
      effectiveFrom: formData.get("effectiveFrom"),
    });
    if (rateParsed.success && rateParsed.data.hourlyRateNok) {
      await prisma.rateCard.create({
        data: {
          resourceId: resource.id,
          effectiveFrom: new Date(rateParsed.data.effectiveFrom),
          costBasis: "hourly",
          hourlyRateNok: rateParsed.data.hourlyRateNok,
          invoiceFactor: rateParsed.data.invoiceFactor,
          vatPct: rateParsed.data.vatPct ?? null,
          source: "Manuelt registrert",
        },
      });
    }
  }

  revalidatePath("/resources");
  return { id: resource.id };
}

export async function updateResource(id: string, formData: FormData) {
  const parsed = ResourceSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    employmentType: formData.get("employmentType"),
    companyId: formData.get("companyId"),
    primaryRole: formData.get("primaryRole") || undefined,
    department: formData.get("department") || undefined,
    activeFrom: formData.get("activeFrom") || null,
    activeTo: formData.get("activeTo") || null,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { activeFrom, activeTo, companyId, ...rest } = parsed.data;
  await prisma.resource.update({
    where: { id },
    data: {
      ...rest,
      company: { connect: { id: companyId } },
      activeFrom: activeFrom ? new Date(activeFrom) : null,
      activeTo: activeTo ? new Date(activeTo) : null,
    },
  });
  revalidatePath("/resources");
}

export async function deleteResource(id: string) {
  await prisma.resourceCompetency.deleteMany({ where: { resourceId: id } });
  await prisma.rateCard.deleteMany({ where: { resourceId: id } });
  await prisma.allocation.deleteMany({ where: { resourceId: id } });
  await prisma.resource.delete({ where: { id } });
  revalidatePath("/resources");
}

export async function addRateCard(resourceId: string, formData: FormData) {
  const parsed = RateCardSchema.safeParse({
    hourlyRateNok: formData.get("hourlyRateNok"),
    invoiceFactor: formData.get("invoiceFactor") || 1.0,
    vatPct: formData.get("vatPct") || undefined,
    effectiveFrom: formData.get("effectiveFrom"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.rateCard.create({
    data: {
      resourceId,
      effectiveFrom: new Date(parsed.data.effectiveFrom),
      costBasis: "hourly",
      hourlyRateNok: parsed.data.hourlyRateNok ?? null,
      invoiceFactor: parsed.data.invoiceFactor,
      vatPct: parsed.data.vatPct ?? null,
      source: "Manuelt registrert",
    },
  });

  revalidatePath(`/resources/${resourceId}`);
}

export async function deleteRateCard(rateCardId: string, resourceId: string) {
  await prisma.rateCard.delete({ where: { id: rateCardId } });
  revalidatePath(`/resources/${resourceId}`);
}
