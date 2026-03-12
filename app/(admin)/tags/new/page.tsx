import { createTag } from "../actions";
import { redirect } from "next/navigation";

export default function NewTagPage() {
  async function handleSubmit(formData: FormData) {
    "use server";
    const result = await createTag(formData);
    if (!result?.error) redirect("/tags");
  }

  return (
    <div className="max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Ny merkelapp</h1>
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
          <label className="block text-sm font-medium text-gray-700">
            Farge <span className="text-gray-400">(valgfri, hex-kode)</span>
          </label>
          <input
            name="color"
            type="color"
            className="mt-1 h-10 w-full cursor-pointer rounded border px-1 py-1"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Opprett merkelapp
          </button>
          <a href="/tags" className="rounded border px-4 py-2 text-sm hover:bg-gray-50">
            Avbryt
          </a>
        </div>
      </form>
    </div>
  );
}
