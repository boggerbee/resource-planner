"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useRef } from "react";
import Link from "next/link";

interface Props {
  companies: { id: string; name: string }[];
  current: {
    name?: string;
    companyId?: string;
    type?: string;
    employmentType?: string;
  };
}

export function ResourceFilterBar({ companies, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams();
      const merged = { ...current, ...patch };
      for (const [k, v] of Object.entries(merged)) {
        if (v) params.set(k, v);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [current, pathname, router]
  );

  const hasFilter = current.name || current.companyId || current.type || current.employmentType;

  return (
    <div className="flex flex-wrap gap-3 rounded border bg-white p-4">
      <div>
        <label className="block text-xs font-medium text-gray-500">Navn</label>
        <input
          defaultValue={current.name ?? ""}
          placeholder="Søk…"
          className="mt-1 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            const val = e.target.value;
            debounceRef.current = setTimeout(() => push({ name: val }), 300);
          }}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500">Firma</label>
        <select
          defaultValue={current.companyId ?? ""}
          onChange={(e) => push({ companyId: e.target.value })}
          className="mt-1 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Alle</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500">Type</label>
        <select
          defaultValue={current.type ?? ""}
          onChange={(e) => push({ type: e.target.value })}
          className="mt-1 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Alle</option>
          <option value="person">Person</option>
          <option value="placeholder">Placeholder</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500">Ansettelse</label>
        <select
          defaultValue={current.employmentType ?? ""}
          onChange={(e) => push({ employmentType: e.target.value })}
          className="mt-1 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Alle</option>
          <option value="internal">Intern (fast ansatt)</option>
          <option value="internal_temporary">Intern (midlertidig)</option>
          <option value="external">Ekstern</option>
        </select>
      </div>
      {hasFilter && (
        <div className="flex items-end">
          <Link
            href="/resources"
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Nullstill
          </Link>
        </div>
      )}
    </div>
  );
}
