import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function CompaniesPage() {
  const companies = await prisma.company.findMany({
    include: { companyType: true, _count: { select: { resources: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Firma</h1>
        <Link
          href="/companies/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Nytt firma
        </Link>
      </div>
      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Navn</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Ressurser</th>
              <th className="px-4 py-3">Intern</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {companies.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/companies/${c.id}`} className="hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{c.companyType.name}</td>
                <td className="px-4 py-3 text-gray-600">{c._count.resources}</td>
                <td className="px-4 py-3">
                  {c.isInternalCompany ? (
                    <Badge variant="default">Ja</Badge>
                  ) : (
                    <span className="text-gray-400">Nei</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={c.active ? "default" : "secondary"}>
                    {c.active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {companies.length === 0 && (
          <p className="px-4 py-8 text-center text-gray-400">
            Ingen firma registrert ennå.
          </p>
        )}
      </div>
    </div>
  );
}
