"use client";

import { addRateCard, deleteRateCard } from "../actions";

interface RateCard {
  id: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  hourlyRateNok: number | null;
  invoiceFactor: number | null;
  vatPct: number | null;
}

interface Props {
  resourceId: string;
  rateCards: RateCard[];
  employmentType: "internal" | "internal_temporary" | "external";
  defaultInternalHourlyRate?: number | null;
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("nb-NO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatNok(n: number) {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(n);
}

const MONTH_NAMES = ["januar", "februar", "mars", "april", "mai", "juni",
  "juli", "august", "september", "oktober", "november", "desember"];

function getUncoveredMonths(rateCards: RateCard[], year: number): number[] {
  const uncovered: number[] = [];
  for (let month = 1; month <= 12; month++) {
    const periodStart = new Date(Date.UTC(year, month - 1, 1));
    const covered = rateCards.some((rc) => {
      const from = new Date(rc.effectiveFrom);
      const to = rc.effectiveTo ? new Date(rc.effectiveTo) : null;
      return from <= periodStart && (to === null || to > periodStart);
    });
    if (!covered) uncovered.push(month);
  }
  return uncovered;
}

function formatUncoveredMonths(months: number[]): string {
  if (months.length === 0) return "";
  if (months.length === 12) return "hele året";
  // Group consecutive months
  const ranges: string[] = [];
  let start = months[0];
  let end = months[0];
  for (let i = 1; i < months.length; i++) {
    if (months[i] === end + 1) {
      end = months[i];
    } else {
      ranges.push(start === end ? MONTH_NAMES[start - 1] : `${MONTH_NAMES[start - 1]}–${MONTH_NAMES[end - 1]}`);
      start = months[i];
      end = months[i];
    }
  }
  ranges.push(start === end ? MONTH_NAMES[start - 1] : `${MONTH_NAMES[start - 1]}–${MONTH_NAMES[end - 1]}`);
  return ranges.join(", ");
}

export function RateCardSection({
  resourceId,
  rateCards,
  employmentType,
  defaultInternalHourlyRate,
}: Props) {
  const isInternal = employmentType !== "external";
  const currentYear = new Date().getFullYear();
  const uncoveredMonths = getUncoveredMonths(rateCards, currentYear);
  const invoiceLabel = isInternal ? "Stillingsprosent (0–1)" : "Faktureringsgrad (0–1)";
  const invoiceColLabel = isInternal ? "Stillingsprosent" : "Faktureringsgrad";
  const defaultHourly = isInternal && defaultInternalHourlyRate
    ? String(defaultInternalHourlyRate)
    : "";

  async function handleAdd(formData: FormData) {
    await addRateCard(resourceId, formData);
  }

  async function handleDelete(rateCardId: string) {
    await deleteRateCard(rateCardId, resourceId);
  }

  return (
    <div className="space-y-3 rounded border bg-white p-6">
      <h2 className="font-semibold text-gray-800">Timepris / ratekort</h2>
      <p className="text-xs text-gray-500">
        Legg til en rad per prisendring. Gjeldende pris for en periode beregnes etter dato.
      </p>

      {rateCards.length > 0 && (
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="pb-2">Gjelder fra</th>
              <th className="pb-2">Timepris eks. mva</th>
              <th className="pb-2">{invoiceColLabel}</th>
              {!isInternal && <th className="pb-2">MVA</th>}
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rateCards.map((rc) => (
              <tr key={rc.id}>
                <td className="py-2 text-gray-700">{formatDate(rc.effectiveFrom)}</td>
                <td className="py-2 font-medium">
                  {rc.hourlyRateNok != null ? formatNok(rc.hourlyRateNok) + "/t" : "—"}
                </td>
                <td className="py-2 text-gray-600">
                  {rc.invoiceFactor != null
                    ? `${(rc.invoiceFactor * 100).toFixed(0)} %`
                    : "100 %"}
                </td>
                {!isInternal && (
                  <td className="py-2 text-gray-600">
                    {rc.vatPct != null ? `${(rc.vatPct * 100).toFixed(0)} %` : "—"}
                  </td>
                )}
                <td className="py-2 text-right">
                  <form action={() => handleDelete(rc.id)}>
                    <button type="submit" className="text-xs text-red-500 hover:underline">
                      Slett
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {uncoveredMonths.length > 0 && (
        <div className="flex items-start gap-2 rounded border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800">
          <span className="mt-0.5 shrink-0">⚠</span>
          <span>
            Ingen ratekort dekker <strong>{formatUncoveredMonths(uncoveredMonths)} {currentYear}</strong>.
            {" "}Disse månedene vil gi kr 0 i kostnad i rapportene.
          </span>
        </div>
      )}

      <form action={handleAdd} className="mt-4 grid grid-cols-4 gap-3 border-t pt-4">
        <div>
          <label className="block text-xs font-medium text-gray-600">Gjelder fra</label>
          <input
            name="effectiveFrom"
            type="date"
            required
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
        <div className="col-span-4 flex justify-end">
          <button
            type="submit"
            className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700"
          >
            Legg til ratekort
          </button>
        </div>
      </form>
    </div>
  );
}
