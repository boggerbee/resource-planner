import { prisma } from "@/lib/prisma";
import { createTeam } from "../actions";
import { ResourceSearch } from "../resource-search";
import { TagSelector } from "../tag-selector";
import { redirect } from "next/navigation";

export default async function NewTeamPage() {
  const [resources, tags] = await Promise.all([
    prisma.resource.findMany({ where: { type: "person" }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  async function handleSubmit(formData: FormData) {
    "use server";
    const result = await createTeam(formData);
    if (!result?.error) redirect("/teams");
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Nytt team</h1>
      <form action={handleSubmit} className="space-y-4 rounded border bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Navn</label>
          <input
            name="name"
            required
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Prosjektkode</label>
          <input
            name="projectCode"
            required
            className="mt-1 w-full rounded border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Beskrivelse</label>
          <textarea
            name="description"
            rows={3}
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Konto</label>
          <input
            type="number"
            name="konto"
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Koststed</label>
          <input
            type="number"
            name="koststed"
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Attestant</label>
          <ResourceSearch
            resources={resources.map((r) => ({ id: r.id, name: r.name }))}
            defaultValue=""
            defaultName=""
            name="attestantId"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Godkjenner</label>
          <ResourceSearch
            resources={resources.map((r) => ({ id: r.id, name: r.name }))}
            defaultValue=""
            defaultName=""
            name="godkjennerId"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Merkelapper</label>
          <div className="mt-2">
            <TagSelector tags={tags} />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Opprett team
          </button>
          <a href="/teams" className="rounded border px-4 py-2 text-sm hover:bg-gray-50">
            Avbryt
          </a>
        </div>
      </form>
    </div>
  );
}
