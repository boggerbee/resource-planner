import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{
    name?: string;
    companyId?: string;
    type?: string;
    employmentType?: string;
  }>;
}) {
  const params = await searchParams;

  const backUrl =
    "/resources?" +
    new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined)
      ) as Record<string, string>
    ).toString();

  const [resources, companies] = await Promise.all([
    prisma.resource.findMany({
      where: {
        ...(params.name
          ? { name: { contains: params.name, mode: "insensitive" } }
          : {}),
        ...(params.companyId ? { companyId: params.companyId } : {}),
        ...(params.type ? { type: params.type as "person" | "placeholder" } : {}),
        ...(params.employmentType
          ? { employmentType: params.employmentType as "internal" | "external" }
          : {}),
      },
      include: { company: true },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const hasFilter = params.name || params.companyId || params.type || params.employmentType;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ressurser</h1>
        <Link
          href="/resources/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Ny ressurs
        </Link>
      </div>

      <form className="flex flex-wrap gap-3 rounded border bg-white p-4">
        <div>
          <label className="block text-xs font-medium text-gray-500">Navn</label>
          <input
            name="name"
            defaultValue={params.name ?? ""}
            placeholder="Søk…"
            className="mt-1 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Firma</label>
          <select
            name="companyId"
            defaultValue={params.companyId ?? ""}
            className="mt-1 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Alle</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Type</label>
          <select
            name="type"
            defaultValue={params.type ?? ""}
            className="mt-1 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Alle</option>
            <option value="person">Person</option>
            <option value="placeholder">Placeholder</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Ansettelse</label>
          <select
            name="employmentType"
            defaultValue={params.employmentType ?? ""}
            className="mt-1 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Alle</option>
            <option value="internal">Intern</option>
            <option value="external">Ekstern</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded bg-gray-800 px-3 py-1 text-sm text-white hover:bg-gray-700"
          >
            Filtrer
          </button>
          {hasFilter && (
            <Link
              href="/resources"
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Nullstill
            </Link>
          )}
        </div>
      </form>

      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Navn</th>
              <th className="px-4 py-3">Firma</th>
              <th className="px-4 py-3">Avdeling</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Ansettelse</th>
              <th className="px-4 py-3">Primærrolle</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {resources.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/resources/${r.id}?back=${encodeURIComponent(backUrl)}`} className="hover:underline">
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.company.name}</td>
                <td className="px-4 py-3 text-gray-600">{r.department ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={r.type === "placeholder" ? "secondary" : "outline"}>
                    {r.type === "placeholder" ? "Placeholder" : "Person"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={r.employmentType === "internal" ? "default" : "secondary"}>
                    {r.employmentType === "internal" ? "Intern" : "Ekstern"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.primaryRole ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {resources.length === 0 && (
          <p className="px-4 py-8 text-center text-gray-400">
            {hasFilter ? "Ingen ressurser matcher filteret." : "Ingen ressurser registrert ennå."}
          </p>
        )}
      </div>
    </div>
  );
}
