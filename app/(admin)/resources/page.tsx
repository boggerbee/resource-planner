import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function ResourcesPage() {
  const resources = await prisma.resource.findMany({
    include: { company: true },
    orderBy: { name: "asc" },
  });

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
      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Navn</th>
              <th className="px-4 py-3">Firma</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Ansettelse</th>
              <th className="px-4 py-3">Primærrolle</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {resources.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/resources/${r.id}`} className="hover:underline">
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.company.name}</td>
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
                <td className="px-4 py-3 text-right">
                  <Link href={`/resources/${r.id}`} className="text-sm text-blue-600 hover:underline">
                    Rediger
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {resources.length === 0 && (
          <p className="px-4 py-8 text-center text-gray-400">
            Ingen ressurser registrert ennå.
          </p>
        )}
      </div>
    </div>
  );
}
