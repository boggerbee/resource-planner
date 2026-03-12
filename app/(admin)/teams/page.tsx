import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function TeamsPage() {
  const teams = await prisma.team.findMany({
    include: { teamLead: true, tags: { include: { tag: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team</h1>
        <Link
          href="/teams/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Nytt team
        </Link>
      </div>
      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Navn</th>
              <th className="px-4 py-3">Prosjektkode</th>
              <th className="px-4 py-3">Konto</th>
              <th className="px-4 py-3">Koststed</th>
              <th className="px-4 py-3">Beskrivelse</th>
              <th className="px-4 py-3">Teamlead</th>
              <th className="px-4 py-3">Merkelapper</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {teams.map((team) => (
              <tr key={team.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/teams/${team.id}`} className="hover:underline">
                    {team.name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-gray-600">
                  {team.projectCode}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {team.konto ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {team.koststed ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {team.description ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {team.teamLead?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {team.tags.map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        style={
                          tag.color
                            ? { backgroundColor: tag.color + "33", color: tag.color }
                            : { backgroundColor: "#e5e7eb", color: "#374151" }
                        }
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={team.active ? "default" : "secondary"}>
                    {team.active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {teams.length === 0 && (
          <p className="px-4 py-8 text-center text-gray-400">
            Ingen team registrert ennå.
          </p>
        )}
      </div>
    </div>
  );
}
