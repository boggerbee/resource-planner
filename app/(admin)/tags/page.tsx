import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { teams: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Merkelapper</h1>
        <Link
          href="/tags/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Ny merkelapp
        </Link>
      </div>
      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Navn</th>
              <th className="px-4 py-3">Farge</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {tags.map((tag) => (
              <tr key={tag.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={
                      tag.color
                        ? { backgroundColor: tag.color + "33", color: tag.color }
                        : { backgroundColor: "#e5e7eb", color: "#374151" }
                    }
                  >
                    {tag.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {tag.color ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block h-4 w-4 rounded border"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.color}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{tag._count.teams}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/tags/${tag.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Rediger
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tags.length === 0 && (
          <p className="px-4 py-8 text-center text-gray-400">
            Ingen merkelapper registrert ennå.
          </p>
        )}
      </div>
    </div>
  );
}
