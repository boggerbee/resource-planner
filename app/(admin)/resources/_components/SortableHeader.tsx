"use client";

import Link from "next/link";

interface Props {
  column: string;
  label: string;
  currentSort: string;
  currentDir: string;
  filterParams: Record<string, string | undefined>;
}

export function SortableHeader({ column, label, currentSort, currentDir, filterParams }: Props) {
  const isActive = currentSort === column;
  const nextDir = isActive && currentDir === "asc" ? "desc" : "asc";

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filterParams)) {
    if (v && k !== "sort" && k !== "dir") params.set(k, v);
  }
  params.set("sort", column);
  params.set("dir", nextDir);

  return (
    <Link
      href={`/resources?${params.toString()}`}
      className="inline-flex items-center gap-1 hover:text-gray-800"
    >
      {label}
      <span className="text-gray-300">
        {isActive ? (currentDir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </Link>
  );
}
