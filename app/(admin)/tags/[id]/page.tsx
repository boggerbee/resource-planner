import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { updateTag, deleteTag } from "../actions";

export default async function EditTagPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) notFound();

  async function handleUpdate(formData: FormData) {
    "use server";
    const result = await updateTag(id, formData);
    if (!result?.error) redirect("/tags");
  }

  async function handleDelete() {
    "use server";
    await deleteTag(id);
    redirect("/tags");
  }

  return (
    <div className="max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Rediger merkelapp</h1>
      <form action={handleUpdate} className="space-y-4 rounded border bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Navn</label>
          <input
            name="name"
            required
            defaultValue={tag.name}
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
            defaultValue={tag.color ?? "#6b7280"}
            className="mt-1 h-10 w-full cursor-pointer rounded border px-1 py-1"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Lagre
          </button>
          <a href="/tags" className="rounded border px-4 py-2 text-sm hover:bg-gray-50">
            Avbryt
          </a>
        </div>
      </form>

      <div className="rounded border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">Faresone</p>
        <p className="mt-1 text-xs text-red-600">
          Sletting fjerner merkelappen fra alle team automatisk.
        </p>
        <form action={handleDelete} className="mt-3">
          <button
            type="submit"
            className="rounded border border-red-400 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
          >
            Slett merkelapp
          </button>
        </form>
      </div>
    </div>
  );
}
