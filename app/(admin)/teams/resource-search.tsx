"use client";

import { useState, useRef, useEffect } from "react";

type Resource = { id: string; name: string };

export function ResourceSearch({
  resources,
  defaultValue,
  defaultName,
}: {
  resources: Resource[];
  defaultValue: string;
  defaultName: string;
}) {
  const [query, setQuery] = useState(defaultName);
  const [selectedId, setSelectedId] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  // index 0 = "Ingen", index 1..n = filtered items
  const filtered =
    query.trim() === "" || query === defaultName
      ? resources
      : resources.filter((r) =>
          r.name.toLowerCase().includes(query.toLowerCase())
        );

  const totalItems = 1 + filtered.length; // "Ingen" + results

  function select(r: Resource | null) {
    setSelectedId(r?.id ?? "");
    setQuery(r?.name ?? "");
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setOpen(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex === 0) {
        select(null);
      } else if (activeIndex > 0) {
        select(filtered[activeIndex - 1]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <div className="relative">
      <input type="hidden" name="teamLeadId" value={selectedId} />

      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedId("");
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => { setOpen(false); setActiveIndex(-1); }, 150)}
        onKeyDown={handleKeyDown}
        placeholder="Søk etter person…"
        autoComplete="off"
        className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {open && (
        <ul
          ref={listRef}
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border bg-white shadow-lg"
        >
          <li>
            <button
              type="button"
              onMouseDown={() => select(null)}
              className={`w-full px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-50 ${
                activeIndex === 0 ? "bg-gray-100" : ""
              }`}
            >
              Ingen
            </button>
          </li>
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400">Ingen treff</li>
          ) : (
            filtered.map((r, i) => (
              <li key={r.id}>
                <button
                  type="button"
                  onMouseDown={() => select(r)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 ${
                    activeIndex === i + 1 ? "bg-blue-100" : ""
                  } ${r.id === selectedId && activeIndex !== i + 1 ? "font-medium" : ""}`}
                >
                  {r.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
