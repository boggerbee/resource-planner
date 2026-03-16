"use client";

import { useState } from "react";
import { RateCardSection } from "./RateCardSection";

interface RateCard {
  id: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  hourlyRateNok: number | null;
  invoiceFactor: number | null;
  vatPct: number | null;
}

interface Company {
  id: string;
  name: string;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  employmentType: "internal" | "external";
  companyId: string;
  primaryRole: string | null;
  department: string | null;
  activeFrom: Date | null;
  activeTo: Date | null;
  notes: string | null;
  rateCards: RateCard[];
}

interface Props {
  resource: Resource;
  companies: Company[];
  defaultInternalHourlyRate: number | null;
  backUrl: string;
  handleUpdate: (formData: FormData) => Promise<void>;
  handleDelete: () => Promise<void>;
}

export function ResourceEditClient({
  resource,
  companies,
  defaultInternalHourlyRate,
  backUrl,
  handleUpdate,
  handleDelete,
}: Props) {
  const [employmentType, setEmploymentType] = useState<"internal" | "external">(
    resource.employmentType
  );

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Rediger ressurs</h1>

      {/* ─── Grunninfo ─────────────────────────────────────────────────── */}
      <form action={handleUpdate} className="space-y-4 rounded border bg-white p-6">
        <h2 className="font-semibold text-gray-800">Grunninfo</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Navn</label>
            <input
              name="name"
              required
              defaultValue={resource.name}
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              name="type"
              defaultValue={resource.type}
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
              defaultValue={resource.companyId}
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Primærrolle</label>
            <input
              name="primaryRole"
              defaultValue={resource.primaryRole ?? ""}
              placeholder="f.eks. Fullstackutvikler"
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Avdeling</label>
            <input
              name="department"
              defaultValue={resource.department ?? ""}
              placeholder="f.eks. Teknologi"
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Startdato</label>
            <input
              name="activeFrom"
              type="date"
              defaultValue={resource.activeFrom ? resource.activeFrom.toISOString().slice(0, 10) : ""}
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sluttdato</label>
            <input
              name="activeTo"
              type="date"
              defaultValue={resource.activeTo ? resource.activeTo.toISOString().slice(0, 10) : ""}
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Notater</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={resource.notes ?? ""}
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Lagre
          </button>
          <a href={backUrl} className="rounded border px-4 py-2 text-sm hover:bg-gray-50">
            Avbryt
          </a>
        </div>
      </form>

      {/* ─── Ratekort ──────────────────────────────────────────────────── */}
      <RateCardSection
        resourceId={resource.id}
        rateCards={resource.rateCards}
        employmentType={employmentType}
        defaultInternalHourlyRate={defaultInternalHourlyRate}
      />

      {/* ─── Faresone ──────────────────────────────────────────────────── */}
      <div className="rounded border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">Faresone</p>
        <p className="mt-1 text-xs text-red-600">
          Sletting fjerner ressursen permanent, inkludert alle ratekort og allokeringer.
        </p>
        <form action={handleDelete} className="mt-3">
          <button
            type="submit"
            className="rounded border border-red-400 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
          >
            Slett ressurs
          </button>
        </form>
      </div>
    </div>
  );
}
