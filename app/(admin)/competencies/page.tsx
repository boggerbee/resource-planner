import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CompetenciesPage() {
  const competencies = await prisma.competency.findMany({
    include: { _count: { select: { resourceCompetencies: true } } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kompetanser</h1>
        <Link
          href="/competencies/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Ny kompetanse
        </Link>
      </div>
      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Navn</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Ressurser</th>
              <th className="px-4 py-3">Beskrivelse</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {competencies.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.category ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">
                  {c._count.resourceCompetencies}
                </td>
                <td className="px-4 py-3 text-gray-600">{c.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {competencies.length === 0 && (
          <p className="px-4 py-8 text-center text-gray-400">
            Ingen kompetanser registrert ennå.
          </p>
        )}
      </div>
    </div>
  );
}
