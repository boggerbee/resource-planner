import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { updateCompany, deleteCompany } from "../actions";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [company, companyTypes, resourceCount] = await Promise.all([
    prisma.company.findUnique({ where: { id } }),
    prisma.companyType.findMany({ orderBy: { name: "asc" } }),
    prisma.resource.count({ where: { companyId: id } }),
  ]);

  if (!company) notFound();

  async function handleUpdate(formData: FormData) {
    "use server";
    const result = await updateCompany(id, formData);
    if (!result?.error) redirect("/companies");
  }

  async function handleDelete() {
    "use server";
    const result = await deleteCompany(id);
    if (!result?.error) redirect("/companies");
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Rediger firma</h1>
      <form action={handleUpdate} className="space-y-4 rounded border bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Navn</label>
          <input
            name="name"
            required
            defaultValue={company.name}
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            name="companyTypeId"
            required
            defaultValue={company.companyTypeId}
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {companyTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isInternalCompany"
            name="isInternalCompany"
            value="true"
            defaultChecked={company.isInternalCompany}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="isInternalCompany" className="text-sm text-gray-700">
            Intern (vår egen organisasjon)
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            name="active"
            value="true"
            defaultChecked={company.active}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="active" className="text-sm text-gray-700">Aktiv</label>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Lagre
          </button>
          <a href="/companies" className="rounded border px-4 py-2 text-sm hover:bg-gray-50">
            Avbryt
          </a>
        </div>
      </form>

      <div className="rounded border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">Faresone</p>
        {resourceCount > 0 ? (
          <p className="mt-1 text-xs text-red-600">
            Kan ikke slettes — {resourceCount} ressurs{resourceCount !== 1 ? "er er" : " er"} knyttet til dette firmaet.
            Flytt eller slett ressursene først.
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs text-red-600">
              Sletter firmaet permanent.
            </p>
            <form action={handleDelete} className="mt-3">
              <button
                type="submit"
                className="rounded border border-red-400 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
              >
                Slett firma
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
