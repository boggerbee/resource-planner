import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { approveScenario } from "./actions";

const statusLabel: Record<string, string> = {
  draft: "Utkast",
  approved: "Godkjent",
  archived: "Arkivert",
};

const statusVariant: Record<string, "secondary" | "default" | "outline"> = {
  draft: "secondary",
  approved: "default",
  archived: "outline",
};

export default async function ScenariosPage() {
  const scenarios = await prisma.scenario.findMany({
    include: {
      _count: { select: { allocations: true } },
      prevScenario: true,
    },
    orderBy: [{ year: "desc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scenarier</h1>
        <Link
          href="/scenarios/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Nytt scenario
        </Link>
      </div>
      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Navn</th>
              <th className="px-4 py-3">År</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Offset</th>
              <th className="px-4 py-3">Forrige scenario</th>
              <th className="px-4 py-3">Allokeringer</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {scenarios.map((scenario) => (
              <tr key={scenario.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/scenarios/${scenario.id}`} className="hover:underline">
                    {scenario.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{scenario.year}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[scenario.status] ?? "secondary"}>
                    {statusLabel[scenario.status] ?? scenario.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {scenario.externalCostOffsetMonths > 0
                    ? `+${scenario.externalCostOffsetMonths} mnd`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {scenario.prevScenario ? (
                    <Link
                      href={`/scenarios/${scenario.prevScenario.id}`}
                      className="hover:underline text-blue-600"
                    >
                      {scenario.prevScenario.name} ({scenario.prevScenario.year})
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{scenario._count.allocations}</td>
                <td className="px-4 py-3 text-right">
                  {scenario.status !== "approved" && (
                    <form
                      action={async () => {
                        "use server";
                        await approveScenario(scenario.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-sm text-green-700 hover:underline"
                      >
                        Godkjenn
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {scenarios.length === 0 && (
          <p className="px-4 py-8 text-center text-gray-400">
            Ingen scenarier registrert ennå.
          </p>
        )}
      </div>
    </div>
  );
}
