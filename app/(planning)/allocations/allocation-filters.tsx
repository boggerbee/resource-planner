"use client";

import { useRef } from "react";

type Scenario = { id: string; name: string; year: number };
type Team = { id: string; name: string };

export function AllocationFilters({
  scenarios,
  teams,
  scenarioId,
  teamId,
}: {
  scenarios: Scenario[];
  teams: Team[];
  scenarioId: string;
  teamId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} className="flex gap-4 rounded border bg-white p-4">
      <div>
        <label className="block text-xs font-medium text-gray-500">Scenario</label>
        <select
          name="scenarioId"
          defaultValue={scenarioId}
          className="mt-1 rounded border px-2 py-1 text-sm"
          onChange={() => formRef.current?.submit()}
        >
          {scenarios.map((s) => (
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
    </form>
  );
}
