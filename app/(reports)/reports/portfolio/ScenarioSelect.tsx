"use client";

import { useEffect } from "react";

interface Scenario {
  id: string;
  name: string;
  year: number;
}

export function ScenarioSelect({
  scenarios,
  selectedId,
}: {
  scenarios: Scenario[];
  selectedId: string;
}) {
  useEffect(() => {
    document.cookie = `lastPortfolioScenario=${selectedId}; path=/; max-age=31536000`;
  }, [selectedId]);

  return (
    <select
      name="scenarioId"
      defaultValue={selectedId}
      onChange={(e) => {
        document.cookie = `lastPortfolioScenario=${e.target.value}; path=/; max-age=31536000`;
        (e.target.form as HTMLFormElement).submit();
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
