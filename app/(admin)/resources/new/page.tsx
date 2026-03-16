import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { createResource } from "../actions";
import { NewResourceForm } from "../_components/NewResourceForm";

export default async function NewResourcePage() {
  const [companies, settings] = await Promise.all([
    prisma.company.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.systemSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  async function handleSubmit(formData: FormData) {
    "use server";
    const result = await createResource(formData);
    if (!result?.error && result?.id) redirect(`/resources/${result.id}`);
  }

  return (
    <NewResourceForm
      companies={companies}
      defaultInternalHourlyRate={
        settings?.defaultInternalHourlyRate ? Number(settings.defaultInternalHourlyRate) : null
      }
      defaultInternalInvoiceFactor={
        settings?.defaultInternalInvoiceFactor ? Number(settings.defaultInternalInvoiceFactor) : null
      }
      defaultExternalInvoiceFactor={
        settings?.defaultExternalInvoiceFactor ? Number(settings.defaultExternalInvoiceFactor) : null
      }
      handleSubmit={handleSubmit}
    />
  );
}
