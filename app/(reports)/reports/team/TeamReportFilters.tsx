"use client";

type Option = { id: string; label: string };

export function TeamReportFilters({
  scenarios,
  teams,
  scenarioId,
  teamId,
}: {
  scenarios: Option[];
  teams: Option[];
  scenarioId: string;
  teamId: string;
}) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    document.cookie = `${e.currentTarget.name}=${e.currentTarget.value};path=/;max-age=31536000`;
    e.currentTarget.form?.submit();
  }

  return (
    <form className="flex gap-2">
      <select name="scenarioId" defaultValue={scenarioId} onChange={handleChange} className="rounded border px-2 py-1 text-sm">
        {scenarios.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
      <select name="teamId" defaultValue={teamId} onChange={handleChange} className="rounded border px-2 py-1 text-sm">
        {teams.map((t) => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>
    </form>
  );
}
