"use client";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Des",
];

type Period = { id: string; month: number; workingHoursNorm: unknown };
type Resource = {
  id: string;
  name: string;
  employmentType: string;
  type: string;
  company: { name: string };
};

interface Props {
  gridData: Array<{ resource: Resource; months: Record<number, number> }>;
  periods: Period[];
  overbookedKeys: Set<string>;
  scenarioId: string;
  teamId: string;
}

export function AllocationGrid({ gridData, periods, overbookedKeys }: Props) {
  const months = periods.map((p) => p.month);

  return (
    <div className="overflow-x-auto rounded border bg-white">
      <table className="w-full text-sm">
        <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3 text-left">Ressurs</th>
            <th className="px-4 py-3 text-left">Firma</th>
            <th className="px-4 py-3 text-left">Type</th>
            {months.map((m) => (
              <th key={m} className="px-2 py-3 text-center w-16">
                {MONTH_LABELS[m - 1]}
              </th>
            ))}
            <th className="px-4 py-3 text-center">Total FTE</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {gridData.map(({ resource, months: monthData }) => {
            const totalFTE = Object.values(monthData).reduce((s, v) => s + v, 0);
            const avgFTE = months.length > 0 ? totalFTE / months.length : 0;

            return (
              <tr key={resource.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  {resource.name}
                  {resource.type === "placeholder" && (
                    <span className="ml-1 rounded bg-yellow-100 px-1 text-xs text-yellow-700">
                      Placeholder
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{resource.company.name}</td>
                <td className="px-4 py-3 text-gray-600">
                  {resource.employmentType === "internal" ? "Intern" : "Ekstern"}
                </td>
                {months.map((m) => {
                  const pct = monthData[m] ?? 0;
                  const isOverbooked = overbookedKeys.has(`${resource.id}-${m}`);
                  return (
                    <td
                      key={m}
                      className={`px-2 py-3 text-center tabular-nums ${
                        isOverbooked ? "bg-red-50 text-red-700 font-semibold" : ""
                      } ${pct === 0 ? "text-gray-300" : ""}`}
                    >
                      {pct > 0 ? `${Math.round(pct * 100)}%` : "—"}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center font-medium tabular-nums">
                  {avgFTE.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {gridData.length === 0 && (
        <p className="px-4 py-8 text-center text-gray-400">
          Ingen allokeringer for dette teamet i valgt scenario.
        </p>
      )}
    </div>
  );
}
