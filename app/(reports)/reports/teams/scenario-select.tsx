"use client";

import { useRouter } from "next/navigation";

export function ScenarioSelect({
  scenarios,
  value,
}: {
  scenarios: { id: string; name: string; year: number }[];
  value: string;
}) {
  const router = useRouter();

  return (
    <select
      value={value}
      onChange={(e) => {
          document.cookie = `lastTeamsScenarioId=${e.target.value}; path=/; max-age=31536000`;
          router.push(`?scenarioId=${e.target.value}`);
        }}
      className="rounded border px-2 py-1 text-sm"
    >
      {scenarios.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name} ({s.year})
        </option>
      ))}
    </select>
  );
}
