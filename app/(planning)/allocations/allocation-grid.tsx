"use client";

import { Fragment, useState, useTransition, useRef, useEffect } from "react";
import { upsertAllocations, removeResourceFromTeam } from "./actions";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Des",
];

type Period = { id: string; month: number; workingHoursNorm: number };
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
  availableResources: Resource[];
  readOnly?: boolean;
}

// ─── Edit row (inline måneds-input) ────────────────────────────────────────

function EditRow({
  resource,
  months,
  periods,
  scenarioId,
  teamId,
  onClose,
  onRemove,
}: {
  resource: Resource;
  months: Record<number, number>;
  periods: Period[];
  scenarioId: string;
  teamId: string;
  onClose: () => void;
  onRemove: () => void;
}) {
  const [values, setValues] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (let m = 1; m <= 12; m++) {
      init[m] = months[m] !== undefined ? String(Math.round(months[m] * 100)) : "";
    }
    return init;
  });
  const [isPending, startTransition] = useTransition();
  const [confirmRemove, setConfirmRemove] = useState(false);

  function applyToAll(value: string) {
    const filled: Record<number, string> = {};
    for (let m = 1; m <= 12; m++) filled[m] = value;
    setValues(filled);
  }

  function handleSave() {
    const monthValues: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) {
      monthValues[m] = parseFloat(values[m] || "0") || 0;
    }
    startTransition(async () => {
      await upsertAllocations(scenarioId, teamId, resource.id, monthValues);
      onClose();
    });
  }

  function handleRemove() {
    startTransition(async () => {
      await removeResourceFromTeam(scenarioId, teamId, resource.id);
      onRemove();
    });
  }

  const activeMonths = periods.map((p) => p.month);

  return (
    <tr className="bg-blue-50">
      <td colSpan={activeMonths.length + 4} className="px-4 py-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <a
              href={`/resources/${resource.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-gray-800 hover:underline hover:text-blue-600"
            >
              {resource.name}
            </a>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Sett alle til:</span>
              {[0, 25, 50, 75, 100].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => applyToAll(String(v))}
                  className="rounded border px-2 py-0.5 text-xs hover:bg-white"
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2">
            {MONTH_LABELS.map((label, idx) => {
              const month = idx + 1;
              const isActive = activeMonths.includes(month);
              return (
                <div key={month} className="text-center">
                  <label className="block text-xs text-gray-500">{label}</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      min="0"
                      max="200"
                      step="5"
                      value={values[month] ?? ""}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [month]: e.target.value }))
                      }
                      disabled={!isActive}
                      className={`w-full rounded border px-1 py-1.5 text-center text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !isActive ? "bg-gray-100 text-gray-400" : "bg-white"
                      } ${Number(values[month]) > 100 ? "border-orange-400 bg-orange-50" : ""}`}
                    />
                    {values[month] && values[month] !== "0" && (
                      <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        %
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? "Lagrer…" : "Lagre"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="rounded border px-4 py-1.5 text-sm hover:bg-white"
              >
                Avbryt
              </button>
            </div>
            <div>
              {confirmRemove ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Er du sikker?</span>
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={isPending}
                    className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Ja, fjern
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(false)}
                    disabled={isPending}
                    className="rounded border px-3 py-1.5 text-sm hover:bg-white"
                  >
                    Avbryt
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmRemove(true)}
                  disabled={isPending}
                  className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Fjern fra team
                </button>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Add resource panel (outside table to avoid overflow clipping) ──────────

function AddResourcePanel({
  availableResources,
  onAdded,
}: {
  availableResources: Resource[];
  onAdded: (resource: Resource) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = availableResources.filter((r) =>
    `${r.name} ${r.company.name}`.toLowerCase().includes(query.toLowerCase())
  );

  function handleOpen() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSelect(resource: Resource) {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
    onAdded(resource);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) handleSelect(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        disabled={availableResources.length === 0}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400"
      >
        <span className="text-base leading-none">+</span>
        {availableResources.length === 0
          ? "Alle ressurser er allerede lagt til"
          : "Legg til ressurs"}
      </button>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-96">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Søk etter ressurs…"
          className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {(filtered.length > 0 || query) && (
          <ul ref={listRef} className="mt-1 max-h-72 overflow-auto rounded border bg-white shadow-lg">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">Ingen treff</li>
            ) : (
              filtered.map((r, i) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(r)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-blue-50 ${
                      activeIndex === i ? "bg-blue-100" : ""
                    }`}
                  >
                    <span className="font-medium">{r.name}</span>
                    <span className="text-xs text-gray-500">
                      {r.company.name} · {r.employmentType === "external" ? "Ekstern" : "Intern"}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={() => { setOpen(false); setQuery(""); setActiveIndex(-1); }}
        className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        Avbryt
      </button>
    </div>
  );
}

// ─── Main grid ──────────────────────────────────────────────────────────────

export function AllocationGrid({
  gridData: initialGridData,
  periods,
  overbookedKeys,
  scenarioId,
  teamId,
  availableResources: initialAvailable,
  readOnly = false,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  // Track newly added resources (not yet in DB) locally until saved
  const [newRows, setNewRows] = useState<Resource[]>([]);
  const [available, setAvailable] = useState<Resource[]>(initialAvailable);

  const months = periods.map((p) => p.month);

  function handleAddResource(resource: Resource) {
    setNewRows((prev) => [...prev, resource]);
    setAvailable((prev) => prev.filter((r) => r.id !== resource.id));
    setEditingId(resource.id);
  }

  function handleCloseEdit(resourceId: string, isNew: boolean) {
    setEditingId(null);
    if (isNew) {
      // Remove from newRows after saving — page will revalidate and show it in gridData
      setNewRows((prev) => prev.filter((r) => r.id !== resourceId));
    }
  }

  const allRows = [
    ...initialGridData,
    ...newRows.map((r) => ({ resource: r, months: {} as Record<number, number> })),
  ];

  // Sum of per-resource averages (= "headcount equivalent" for the year)
  const sumAvgFte = (filter?: (r: Resource) => boolean) => {
    if (months.length === 0) return 0;
    return allRows
      .filter((row) => !filter || filter(row.resource))
      .reduce((sum, row) => {
        const avg = months.reduce((s, m) => s + (row.months[m] ?? 0), 0) / months.length;
        return sum + avg;
      }, 0);
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded border bg-white">
      <table className="w-full text-sm">
        <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3 text-left">Ressurs</th>
            <th className="px-4 py-3 text-left">Firma</th>
            <th className="px-4 py-3 text-left">Type</th>
            {months.map((m) => (
              <th key={m} className="w-14 px-1 py-3 text-center">
                {MONTH_LABELS[m - 1]}
              </th>
            ))}
            <th className="px-4 py-3 text-center">Snitt FTE</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {allRows.map(({ resource, months: monthData }) => {
            const isEditing = editingId === resource.id;
            const isNew = newRows.some((r) => r.id === resource.id);
            const totalFTE = Object.values(monthData).reduce((s, v) => s + v, 0);
            const avgFTE = months.length > 0 ? totalFTE / months.length : 0;

            return (
              <Fragment key={resource.id}>
                <tr
                  className={`${readOnly ? "cursor-default" : "cursor-pointer"} ${isEditing ? "bg-blue-50" : "hover:bg-gray-50"}`}
                  onClick={() => !readOnly && setEditingId(isEditing ? null : resource.id)}
                >
                  <td className="px-4 py-3 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className={`text-xs transition-transform ${isEditing ? "rotate-90" : ""}`}>
                        ▶
                      </span>
                      {resource.name}
                      {resource.type === "placeholder" && (
                        <span className="rounded bg-yellow-100 px-1 text-xs text-yellow-700">
                          Placeholder
                        </span>
                      )}
                      {isNew && (
                        <span className="rounded bg-blue-100 px-1 text-xs text-blue-700">
                          Ny
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{resource.company.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {resource.employmentType === "external" ? "Ekstern" : "Intern"}
                  </td>
                  {months.map((m) => {
                    const pct = monthData[m] ?? 0;
                    const isOverbooked = overbookedKeys.has(`${resource.id}-${m}`);
                    return (
                      <td
                        key={m}
                        className={`px-1 py-3 text-center tabular-nums ${
                          isOverbooked ? "bg-red-50 font-semibold text-red-700" : ""
                        } ${pct === 0 ? "text-gray-300" : ""}`}
                      >
                        {pct > 0 ? `${Math.round(pct * 100)}%` : "—"}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center font-medium tabular-nums">
                    {avgFTE > 0 ? avgFTE.toFixed(1) : "—"}
                  </td>
                </tr>

                {isEditing && (
                  <EditRow
                    resource={resource}
                    months={monthData}
                    periods={periods}
                    scenarioId={scenarioId}
                    teamId={teamId}
                    onClose={() => handleCloseEdit(resource.id, isNew)}
                    onRemove={() => {
                      setEditingId(null);
                      setNewRows((prev) => prev.filter((r) => r.id !== resource.id));
                      setAvailable((prev) => [...prev, resource].sort((a, b) => a.name.localeCompare(b.name)));
                    }}
                  />
                )}
              </Fragment>
            );
          })}

        </tbody>

        {allRows.length > 0 && (
          <tfoot className="border-t-2 border-gray-200 bg-gray-50 text-xs">
            <tr>
              <td className="px-4 py-2 font-semibold text-gray-800" colSpan={3}>
                Sum FTE (år)
              </td>
              {months.map((m) => (
                <td key={m} className="px-1 py-2" />
              ))}
              <td className="px-4 py-2 text-center tabular-nums">
                <div className="font-semibold text-gray-800">
                  {sumAvgFte() > 0 ? sumAvgFte().toFixed(1) : "—"}
                </div>
                <div className="text-gray-500">
                  {sumAvgFte((r) => r.employmentType === "internal") > 0
                    ? `${sumAvgFte((r) => r.employmentType === "internal").toFixed(1)} int`
                    : ""}
                </div>
                <div className="text-gray-500">
                  {sumAvgFte((r) => r.employmentType === "external") > 0
                    ? `${sumAvgFte((r) => r.employmentType === "external").toFixed(1)} eks`
                    : ""}
                </div>
              </td>
            </tr>
          </tfoot>
        )}
      </table>

      {allRows.length === 0 && (
        <p className="px-4 py-4 text-center text-sm text-gray-400">
          Ingen allokeringer ennå — legg til en ressurs under.
        </p>
      )}
      </div>

      {!readOnly && (
        <div className="px-1">
          <AddResourcePanel
            availableResources={available}
            onAdded={handleAddResource}
          />
        </div>
      )}
    </div>
  );
}
