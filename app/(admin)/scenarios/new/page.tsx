import { createScenario } from "../actions";
import { redirect } from "next/navigation";

export default function NewScenarioPage() {
  const currentYear = new Date().getFullYear();

  async function handleSubmit(formData: FormData) {
    "use server";
    const result = await createScenario(formData);
    if (!result?.error) redirect("/scenarios");
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Nytt scenario</h1>
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
          <label className="block text-sm font-medium text-gray-700">År</label>
          <input
            name="year"
            type="number"
            required
            defaultValue={currentYear}
            min={2020}
            max={2099}
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            defaultValue="draft"
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
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-xs text-gray-500">
          12 planperioder (januar–desember) opprettes automatisk med 162 t/mnd.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Opprett scenario
          </button>
          <a href="/scenarios" className="rounded border px-4 py-2 text-sm hover:bg-gray-50">
            Avbryt
          </a>
        </div>
      </form>
    </div>
  );
}
