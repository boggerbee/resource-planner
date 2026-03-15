import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { updateScenario, deleteScenario, copyScenario, approveScenario } from "../actions";

export default async function EditScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenario = await prisma.scenario.findUnique({
    where: { id },
    include: {
      _count: { select: { allocations: true } },
      prevScenario: true,
    },
  });
  if (!scenario) notFound();

  const hasAllocations = scenario._count.allocations > 0;

  // Approved scenarios for year-1 as prevScenario candidates
  const prevCandidates = await prisma.scenario.findMany({
    where: { status: "approved", year: scenario.year - 1 },
    orderBy: { name: "asc" },
  });

  async function handleUpdate(formData: FormData) {
    "use server";
    const result = await updateScenario(id, formData);
    if (!result?.error) redirect("/scenarios");
  }

  async function handleDelete() {
    "use server";
    const result = await deleteScenario(id);
    if (!result?.error) redirect("/scenarios");
  }

  async function handleCopy(formData: FormData) {
    "use server";
    const result = await copyScenario(id, formData);
    if (result.newId) redirect(`/scenarios/${result.newId}`);
  }

  async function handleApprove() {
    "use server";
    await approveScenario(id);
    redirect("/scenarios");
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Rediger scenario</h1>
      <form action={handleUpdate} className="space-y-4 rounded border bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Navn</label>
          <input
            name="name"
            required
            defaultValue={scenario.name}
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">År</label>
          <input
            name="year"
            type="number"
            required
            defaultValue={scenario.year}
            min={2020}
            max={2099}
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            defaultValue={scenario.status}
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Utkast</option>
            <option value="approved">Godkjent</option>
            <option value="archived">Arkivert</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Beskrivelse</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={scenario.description ?? ""}
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Ekstern kostnadsforskyving (måneder)
          </label>
          <input
            name="externalCostOffsetMonths"
            type="number"
            min={0}
            max={12}
            defaultValue={scenario.externalCostOffsetMonths}
            className="mt-1 w-32 rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            0 = ingen forskyving. 1 = ekstern kostnad bokføres måneden etter levering.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Forrige godkjente scenario (carry-over)
          </label>
          <select
            name="prevScenarioId"
            defaultValue={scenario.prevScenarioId ?? ""}
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Ingen —</option>
            {prevCandidates.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.year})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Brukes til carry-over av desemberkostnader ved ekstern kostnadsforskyving.
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Lagre
          </button>
          <a href="/scenarios" className="rounded border px-4 py-2 text-sm hover:bg-gray-50">
            Avbryt
          </a>
        </div>
      </form>

      {scenario.status !== "approved" && (
        <div className="rounded border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">Godkjenning</p>
          <p className="mt-1 text-xs text-green-700">
            Godkjenner dette scenariet som styringsgrunnlag for {scenario.year}. Andre godkjente
            scenarioer for samme år arkiveres automatisk.
          </p>
          <form action={handleApprove} className="mt-3">
            <button
              type="submit"
              className="rounded border border-green-600 bg-white px-3 py-1.5 text-sm text-green-700 hover:bg-green-100"
            >
              Godkjenn scenario
            </button>
          </form>
        </div>
      )}

      <div className="rounded border bg-white p-6 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Kopier scenario</p>
          <p className="mt-1 text-xs text-gray-500">
            Oppretter et nytt scenario (status: utkast) med samme planperioder og allokeringer.
          </p>
        </div>
        <form action={handleCopy} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600">Nytt navn</label>
              <input
                name="name"
                required
                defaultValue={`Kopi av ${scenario.name}`}
                className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-gray-600">År</label>
              <input
                name="year"
                type="number"
                required
                defaultValue={scenario.year}
                min={2020}
                max={2099}
                className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
          >
            Opprett kopi
          </button>
        </form>
      </div>

      <div className="rounded border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">Faresone</p>
        {hasAllocations ? (
          <p className="mt-1 text-xs text-red-600">
            Kan ikke slette: scenarioet har {scenario._count.allocations} allokering(er).
            Fjern allokeringene først.
          </p>
        ) : (
          <p className="mt-1 text-xs text-red-600">
            Sletting fjerner scenarioet og alle planperioder permanent.
          </p>
        )}
        <form action={handleDelete} className="mt-3">
          <button
            type="submit"
            disabled={hasAllocations}
            className="rounded border border-red-400 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Slett scenario
          </button>
        </form>
      </div>
    </div>
  );
}
