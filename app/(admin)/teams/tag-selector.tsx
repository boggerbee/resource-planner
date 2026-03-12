"use client";

import { useState } from "react";

type Tag = { id: string; name: string; color: string | null };

export function TagSelector({
  tags,
  selectedIds = [],
}: {
  tags: Tag[];
  selectedIds?: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const active = selected.has(tag.id);
        const bg = tag.color ?? "#6b7280";
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className="rounded-full border px-3 py-1 text-xs font-medium transition-all"
            style={
              active
                ? { backgroundColor: bg + "33", borderColor: bg, color: bg }
                : { backgroundColor: "transparent", borderColor: "#d1d5db", color: "#6b7280" }
            }
          >
            {tag.name}
          </button>
        );
      })}
      {selected.size > 0 &&
        Array.from(selected).map((id) => (
          <input key={id} type="hidden" name="tagIds" value={id} />
        ))}
      {tags.length === 0 && (
        <p className="text-xs text-gray-400">Ingen merkelapper opprettet ennå.</p>
      )}
    </div>
  );
}
