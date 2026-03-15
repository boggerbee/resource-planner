"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateSettings(formData: FormData) {
  const raw = formData.get("defaultInternalHourlyRate");
  const defaultInternalHourlyRate =
    raw && String(raw).trim() !== "" ? parseFloat(String(raw)) : null;

  await prisma.systemSettings.upsert({
    where: { id: "singleton" },
    update: { defaultInternalHourlyRate },
    create: { id: "singleton", defaultInternalHourlyRate },
  });

  revalidatePath("/settings");
}
