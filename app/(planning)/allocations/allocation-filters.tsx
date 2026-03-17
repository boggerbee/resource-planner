"use client";

import { useRef, useState, useEffect } from "react";

type Scenario = { id: string; name: string; year: number; status: string };
type Team = { id: string; name: string };

export function AllocationFilters({
  scenarios,
  teams,
  scenarioId,
  teamId,
  onlyEditable,
}: {
  scenarios: Scenario[];
  teams: Team[];
  scenarioId: string;
  teamId: string;
  onlyEditable: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [filtered, setFiltered] = useState(onlyEditable);

  const visibleScenarios = filtered
    ? scenarios.filter((s) => s.status === "draft")
    : scenarios;

  // If current scenarioId is not in visible list after filtering, pick first visible
  const effectiveScenarioId =
    visibleScenarios.some((s) => s.id === scenarioId)
      ? scenarioId
      : (visibleScenarios[0]?.id ?? scenarioId);

  useEffect(() => {
    document.cookie = `lastAllocationScenario=${effectiveScenarioId}; path=/; max-age=31536000`;
  }, [effectiveScenarioId]);

  useEffect(() => {
    document.cookie = `lastAllocationTeam=${teamId}; path=/; max-age=31536000`;
  }, [teamId]);

  return (
    <form ref={formRef} className="flex flex-wrap items-end gap-4 rounded border bg-white p-4">
      <div>
        <label className="block text-xs font-medium text-gray-500">Scenario</label>
        <select
          name="scenarioId"
          value={effectiveScenarioId}
          className="mt-1 rounded border px-2 py-1 text-sm"
          onChange={() => formRef.current?.submit()}
        >
          {visibleScenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.year})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500">Team</label>
        <select
          name="teamId"
          defaultValue={teamId}
          className="mt-1 rounded border px-2 py-1 text-sm"
          onChange={() => formRef.current?.submit()}
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 pb-1">
        <input
          type="checkbox"
          id="onlyEditable"
          name="onlyEditable"
          value="1"
          checked={filtered}
          onChange={(e) => {
            setFiltered(e.target.checked);
            setTimeout(() => formRef.current?.submit(), 0);
          }}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="onlyEditable" className="text-sm text-gray-600 cursor-pointer select-none">
          Vis bare redigerbare
        </label>
      </div>
    </form>
  );
}
