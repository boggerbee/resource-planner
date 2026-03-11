import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { updateResource, deleteResource, addRateCard, deleteRateCard } from "../actions";

function formatDate(d: Date) {
  return d.toLocaleDateString("nb-NO", { year: "numeric", month: "short", day: "numeric" });
}

function formatNok(n: unknown) {
  return new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(Number(n));
}

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

  const [resource, companies] = await Promise.all([
    prisma.resource.findUnique({
      where: { id },
      include: {
        rateCards: { orderBy: { effectiveFrom: "asc" } },
        company: true,
      },
    }),
    prisma.company.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
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

  async function handleAddRateCard(formData: FormData) {
    "use server";
    await addRateCard(id, formData);
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Rediger ressurs</h1>

      {/* ─── Grunninfo ─────────────────────────────────────────────────── */}
      <form action={handleUpdate} className="space-y-4 rounded border bg-white p-6">
        <h2 className="font-semibold text-gray-800">Grunninfo</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Navn</label>
            <input
              name="name"
              required
              defaultValue={resource.name}
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              name="type"
              defaultValue={resource.type}
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="person">Person</option>
              <option value="placeholder">Placeholder (ubesatt)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Ansettelsestype</label>
            <select
              name="employmentType"
              defaultValue={resource.employmentType}
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="internal">Intern (fast ansatt)</option>
              <option value="external">Ekstern (konsulent)</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Firma</label>
            <select
              name="companyId"
              defaultValue={resource.companyId}
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Primærrolle</label>
            <input
              name="primaryRole"
              defaultValue={resource.primaryRole ?? ""}
              placeholder="f.eks. Fullstackutvikler"
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Notater</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={resource.notes ?? ""}
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Lagre
          </button>
          <a href={backUrl} className="rounded border px-4 py-2 text-sm hover:bg-gray-50">
            Avbryt
          </a>
        </div>
      </form>

      {/* ─── Ratekort ──────────────────────────────────────────────────── */}
      <div className="space-y-3 rounded border bg-white p-6">
        <h2 className="font-semibold text-gray-800">Timepris / ratekort</h2>
        <p className="text-xs text-gray-500">
          Legg til en rad per prisendring. Gjeldende pris for en periode beregnes etter dato.
        </p>

        {resource.rateCards.length > 0 && (
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="pb-2">Gjelder fra</th>
                <th className="pb-2">Timepris eks. mva</th>
                <th className="pb-2">Faktureringsgrad</th>
                <th className="pb-2">MVA</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {resource.rateCards.map((rc) => (
                <tr key={rc.id}>
                  <td className="py-2 text-gray-700">{formatDate(rc.effectiveFrom)}</td>
                  <td className="py-2 font-medium">
                    {rc.hourlyRateNok ? formatNok(rc.hourlyRateNok) + "/t" : "—"}
                  </td>
                  <td className="py-2 text-gray-600">
                    {rc.invoiceFactor ? `${(Number(rc.invoiceFactor) * 100).toFixed(0)} %` : "100 %"}
                  </td>
                  <td className="py-2 text-gray-600">
                    {rc.vatPct ? `${(Number(rc.vatPct) * 100).toFixed(0)} %` : "—"}
                  </td>
                  <td className="py-2 text-right">
                    <form
                      action={async () => {
                        "use server";
                        await deleteRateCard(rc.id, id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs text-red-500 hover:underline"
                      >
                        Slett
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Legg til nytt ratekort */}
        <form action={handleAddRateCard} className="mt-4 grid grid-cols-4 gap-3 border-t pt-4">
          <div>
            <label className="block text-xs font-medium text-gray-600">Gjelder fra</label>
            <input
              name="effectiveFrom"
              type="date"
              required
              defaultValue="2026-01-01"
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Timepris eks. mva</label>
            <input
              name="hourlyRateNok"
              type="number"
              min="0"
              step="1"
              placeholder="1500"
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Faktureringsgrad (0–1)</label>
            <input
              name="invoiceFactor"
              type="number"
              min="0"
              max="2"
              step="0.01"
              defaultValue="1.0"
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">MVA (0–1)</label>
            <input
              name="vatPct"
              type="number"
              min="0"
              max="1"
              step="0.01"
              placeholder="0.25"
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-4 flex justify-end">
            <button
              type="submit"
              className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700"
            >
              Legg til ratekort
            </button>
          </div>
        </form>
      </div>

      {/* ─── Faresone ──────────────────────────────────────────────────── */}
      <div className="rounded border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">Faresone</p>
        <p className="mt-1 text-xs text-red-600">
          Sletting fjerner ressursen permanent, inkludert alle ratekort og allokeringer.
        </p>
        <form action={handleDelete} className="mt-3">
          <button
            type="submit"
            className="rounded border border-red-400 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
          >
            Slett ressurs
          </button>
        </form>
      </div>
    </div>
  );
}
