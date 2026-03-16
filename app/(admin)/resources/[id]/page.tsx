import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { updateResource, deleteResource } from "../actions";
import { ResourceEditClient } from "../_components/ResourceEditClient";

export default async function EditResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ back?: string }>;
}) {
  const { id } = await params;
  const { back } = await searchParams;
  const backUrl = back ?? "/resources";

  const [resource, companies, settings] = await Promise.all([
    prisma.resource.findUnique({
      where: { id },
      include: {
        rateCards: { orderBy: { effectiveFrom: "asc" } },
        company: true,
      },
    }),
    prisma.company.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.systemSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  if (!resource) notFound();

  async function handleUpdate(formData: FormData) {
    "use server";
    const result = await updateResource(id, formData);
    if (!result?.error) redirect(backUrl);
  }

  async function handleDelete() {
    "use server";
    await deleteResource(id);
    redirect(backUrl);
  }

  return (
    <ResourceEditClient
      resource={{
        id: resource.id,
        name: resource.name,
        type: resource.type,
        employmentType: resource.employmentType,
        companyId: resource.companyId,
        primaryRole: resource.primaryRole,
        department: resource.department,
        activeFrom: resource.activeFrom ?? null,
        activeTo: resource.activeTo ?? null,
        notes: resource.notes,
        rateCards: resource.rateCards.map((rc) => ({
          id: rc.id,
          effectiveFrom: rc.effectiveFrom,
          effectiveTo: rc.effectiveTo ?? null,
          hourlyRateNok: rc.hourlyRateNok ? Number(rc.hourlyRateNok) : null,
          invoiceFactor: rc.invoiceFactor ? Number(rc.invoiceFactor) : null,
          vatPct: rc.vatPct ? Number(rc.vatPct) : null,
        })),
      }}
      companies={companies}
      defaultInternalHourlyRate={
        settings?.defaultInternalHourlyRate
          ? Number(settings.defaultInternalHourlyRate)
          : null
      }
      backUrl={backUrl}
      handleUpdate={handleUpdate}
      handleDelete={handleDelete}
    />
  );
}
