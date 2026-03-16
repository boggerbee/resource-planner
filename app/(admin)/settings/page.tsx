import { prisma } from "@/lib/prisma";
import { updateSettings } from "./actions";

export default async function SettingsPage() {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "singleton" },
  });

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Innstillinger</h1>

      <form action={updateSettings} className="space-y-4 rounded border bg-white p-6">
        <h2 className="font-semibold text-gray-800">Globale standardverdier</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Standard intern timepris (NOK)
          </label>
          <p className="text-xs text-gray-500 mt-0.5">
            Pre-fyller timeprisen når du legger til ratekort for interne ressurser.
          </p>
          <input
            name="defaultInternalHourlyRate"
            type="number"
            min="0"
            step="1"
            defaultValue={settings?.defaultInternalHourlyRate?.toString() ?? ""}
            placeholder="f.eks. 900"
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Standard stillingsprosent — intern (%)
          </label>
          <p className="text-xs text-gray-500 mt-0.5">
            Pre-fyller stillingsprosent når du legger til ratekort for interne ressurser.
          </p>
          <div className="mt-1 flex items-center gap-1">
            <input
              name="defaultInternalInvoiceFactorPct"
              type="number"
              min="0"
              max="200"
              step="1"
              defaultValue={
                settings?.defaultInternalInvoiceFactor != null
                  ? (Number(settings.defaultInternalInvoiceFactor) * 100).toFixed(0)
                  : ""
              }
              placeholder="100"
              className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Standard faktureringsgrad — ekstern (%)
          </label>
          <p className="text-xs text-gray-500 mt-0.5">
            Pre-fyller faktureringsgrad når du legger til ratekort for eksterne ressurser.
          </p>
          <div className="mt-1 flex items-center gap-1">
            <input
              name="defaultExternalInvoiceFactorPct"
              type="number"
              min="0"
              max="200"
              step="1"
              defaultValue={
                settings?.defaultExternalInvoiceFactor != null
                  ? (Number(settings.defaultExternalInvoiceFactor) * 100).toFixed(0)
                  : ""
              }
              placeholder="100"
              className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Lagre innstillinger
          </button>
        </div>
      </form>
      <div className="rounded border border-blue-100 bg-blue-50 p-5 text-xs text-blue-900 space-y-2">
        <p className="font-semibold text-sm">Beregning av månedskostnad</p>
        <p className="font-mono bg-white/60 rounded px-2 py-1">
          Ekstern: timepris × arbeidstimer × allokering% × fakturafaktor
        </p>
        <p className="font-mono bg-white/60 rounded px-2 py-1">
          Intern: timepris × arbeidstimer × allokering%
        </p>
        <p className="text-blue-700">
          Arbeidstimer og fakturafaktor settes per scenario under fanen «Scenarier».
        </p>
      </div>
    </div>
  );
}
