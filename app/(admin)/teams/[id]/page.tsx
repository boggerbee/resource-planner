import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { updateTeam, deleteTeam } from "../actions";
import { ResourceSearch } from "../resource-search";

export default async function EditTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [team, resources] = await Promise.all([
    prisma.team.findUnique({ where: { id }, include: { teamLead: true } }),
    prisma.resource.findMany({ where: { type: "person" }, orderBy: { name: "asc" } }),
  ]);
  if (!team) notFound();

  async function handleUpdate(formData: FormData) {
    "use server";
    const result = await updateTeam(id, formData);
    if (!result?.error) redirect("/teams");
  }

  async function handleDelete() {
    "use server";
    await deleteTeam(id);
    redirect("/teams");
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Rediger team</h1>
      <form action={handleUpdate} className="space-y-4 rounded border bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Navn</label>
          <input
            name="name"
            required
            defaultValue={team.name}
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Prosjektkode</label>
          <input
            name="projectCode"
            required
            defaultValue={team.projectCode}
            className="mt-1 w-full rounded border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Beskrivelse</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={team.description ?? ""}
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Teamlead</label>
          <ResourceSearch
            resources={resources.map((r) => ({ id: r.id, name: r.name }))}
            defaultValue={team.teamLeadId ?? ""}
            defaultName={team.teamLead?.name ?? ""}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            name="active"
            value="true"
            defaultChecked={team.active}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="active" className="text-sm text-gray-700">Aktiv</label>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Lagre
          </button>
          <a href="/teams" className="rounded border px-4 py-2 text-sm hover:bg-gray-50">
            Avbryt
          </a>
        </div>
      </form>

      <div className="rounded border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">Faresone</p>
        <p className="mt-1 text-xs text-red-600">
          Sletting fjerner teamet permanent. Allokeringer knyttet til teamet vil også slettes.
        </p>
        <form action={handleDelete} className="mt-3">
          <button
            type="submit"
            className="rounded border border-red-400 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
          >
            Slett team
          </button>
        </form>
      </div>
    </div>
  );
}
