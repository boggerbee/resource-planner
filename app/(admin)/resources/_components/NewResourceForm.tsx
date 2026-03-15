"use client";

import { useState } from "react";

interface Company {
  id: string;
  name: string;
}

interface Props {
  companies: Company[];
  defaultInternalHourlyRate: number | null;
  handleSubmit: (formData: FormData) => Promise<void>;
}

export function NewResourceForm({ companies, defaultInternalHourlyRate, handleSubmit }: Props) {
  const [employmentType, setEmploymentType] = useState<"internal" | "external">("external");

  const isInternal = employmentType === "internal";
  const invoiceLabel = isInternal ? "Stillingsprosent (0–1)" : "Faktureringsgrad (0–1)";
  const defaultHourly = isInternal && defaultInternalHourlyRate
    ? String(defaultInternalHourlyRate)
    : "";

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Ny ressurs</h1>
      <form action={handleSubmit} className="space-y-4 rounded border bg-white p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Navn</label>
            <input
              name="name"
              required
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              name="type"
              defaultValue="person"
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="person">Person</option>
              <option value="placeholder">Placeholder (ubesatt)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Ansettelsestype</label>
            <select
              name="employmentType"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as "internal" | "external")}
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="internal">Intern (fast ansatt)</option>
              <option value="external">Ekstern (konsulent)</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Firma</label>
            <select
              name="companyId"
              required
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Velg firma…</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Primærrolle</label>
            <input
              name="primaryRole"
              placeholder="f.eks. Fullstackutvikler"
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <hr className="my-2" />
        <p className="text-sm font-medium text-gray-700">Timepris (valgfritt)</p>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600">Gjelder fra</label>
            <input
              name="effectiveFrom"
              type="date"
              defaultValue="2026-01-01"
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Timepris eks. mva</label>
            <input
              name="hourlyRateNok"
              type="number"
              min="0"
              step="1"
              defaultValue={defaultHourly}
              placeholder={isInternal ? (defaultInternalHourlyRate ? String(defaultInternalHourlyRate) : "900") : "1500"}
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">{invoiceLabel}</label>
            <input
              name="invoiceFactor"
              type="number"
              min="0"
              max="2"
              step="0.01"
              defaultValue="1.0"
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {!isInternal && (
            <div>
              <label className="block text-xs font-medium text-gray-600">MVA (0–1)</label>
              <input
                name="vatPct"
                type="number"
                min="0"
                max="1"
                step="0.01"
                placeholder="0.25"
                className="mt-1 w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Opprett ressurs
          </button>
          <a href="/resources" className="rounded border px-4 py-2 text-sm hover:bg-gray-50">
            Avbryt
          </a>
        </div>
      </form>
    </div>
  );
}
