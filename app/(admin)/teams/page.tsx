import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function TeamsPage() {
  const teams = await prisma.team.findMany({
    include: { teamLead: true },
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
              <th className="px-4 py-3">Beskrivelse</th>
              <th className="px-4 py-3">Teamlead</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
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
                  {team.description ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {team.teamLead?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={team.active ? "default" : "secondary"}>
                    {team.active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/teams/${team.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Rediger
                  </Link>
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
