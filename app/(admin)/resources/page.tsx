import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ResourceFilterBar } from "./_components/ResourceFilterBar";
import { SortableHeader } from "./_components/SortableHeader";

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{
    name?: string;
    companyId?: string;
    type?: string;
    employmentType?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const params = await searchParams;
  const sort = params.sort ?? "name";
  const dir = (params.dir === "desc" ? "desc" : "asc") as "asc" | "desc";

  const orderBy = (() => {
    switch (sort) {
      case "company":   return { company: { name: dir } };
      case "department": return { department: dir };
      case "type":      return { type: dir };
      case "employmentType": return { employmentType: dir };
      case "primaryRole":   return { primaryRole: dir };
      default:          return { name: dir };
    }
  })();

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
          ? { employmentType: params.employmentType as "internal" | "internal_temporary" | "external" }
          : {}),
      },
      include: { company: true },
      orderBy,
    }),
    prisma.company.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

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

      <ResourceFilterBar companies={companies} current={params} />

      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3"><SortableHeader column="name" label="Navn" currentSort={sort} currentDir={dir} filterParams={params} /></th>
              <th className="px-4 py-3"><SortableHeader column="company" label="Firma" currentSort={sort} currentDir={dir} filterParams={params} /></th>
              <th className="px-4 py-3"><SortableHeader column="department" label="Avdeling" currentSort={sort} currentDir={dir} filterParams={params} /></th>
              <th className="px-4 py-3"><SortableHeader column="type" label="Type" currentSort={sort} currentDir={dir} filterParams={params} /></th>
              <th className="px-4 py-3"><SortableHeader column="employmentType" label="Ansettelse" currentSort={sort} currentDir={dir} filterParams={params} /></th>
              <th className="px-4 py-3"><SortableHeader column="primaryRole" label="Primærrolle" currentSort={sort} currentDir={dir} filterParams={params} /></th>
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
                  <Badge variant={r.employmentType !== "external" ? "default" : "secondary"}>
                    {r.employmentType === "internal" ? "Intern" : r.employmentType === "internal_temporary" ? "Intern (midl.)" : "Ekstern"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.primaryRole ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {resources.length === 0 && (
          <p className="px-4 py-8 text-center text-gray-400">
            {(params.name || params.companyId || params.type || params.employmentType)
              ? "Ingen ressurser matcher filteret."
              : "Ingen ressurser registrert ennå."}
          </p>
        )}
      </div>
    </div>
  );
}
