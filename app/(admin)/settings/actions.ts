"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const parseDecimal = (raw: FormDataEntryValue | null) =>
  raw && String(raw).trim() !== "" ? parseFloat(String(raw)) : null;

export async function updateSettings(formData: FormData) {
  const defaultInternalHourlyRate = parseDecimal(formData.get("defaultInternalHourlyRate"));
  const internalPct = parseDecimal(formData.get("defaultInternalInvoiceFactorPct"));
  const externalPct = parseDecimal(formData.get("defaultExternalInvoiceFactorPct"));
  const defaultInternalInvoiceFactor = internalPct != null ? internalPct / 100 : null;
  const defaultExternalInvoiceFactor = externalPct != null ? externalPct / 100 : null;

  await prisma.systemSettings.upsert({
    where: { id: "singleton" },
    update: { defaultInternalHourlyRate, defaultInternalInvoiceFactor, defaultExternalInvoiceFactor },
    create: { id: "singleton", defaultInternalHourlyRate, defaultInternalInvoiceFactor, defaultExternalInvoiceFactor },
  });

  revalidatePath("/settings");
}
