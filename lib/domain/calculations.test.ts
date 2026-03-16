import {
  computeMonthlyCost,
  computeMonthlyFTE,
  computeAnnualSummary,
  detectOverbooking,
  resolveRateCard,
  type AllocationInput,
  type MonthlyEntry,
  type RateCardPeriod,
} from "./calculations";

// ─── computeMonthlyCost ────────────────────────────────────────────────────

describe("computeMonthlyCost", () => {
  const workingHoursNorm = 162;

  it("external hourly: applies invoiceFactor", () => {
    const input: AllocationInput = {
      allocationPct: 1.0,
      employmentType: "external",
      workingHoursNorm,
      rateCard: { costBasis: "hourly", hourlyRateNok: 1000, invoiceFactor: 0.88 },
    };
    // 1000 * 162 * 1.0 * 0.88 = 142560
    expect(computeMonthlyCost(input)).toBeCloseTo(142560);
  });

  it("internal hourly: ignores invoiceFactor", () => {
    const input: AllocationInput = {
      allocationPct: 1.0,
      employmentType: "internal",
      workingHoursNorm,
      rateCard: { costBasis: "hourly", hourlyRateNok: 1000, invoiceFactor: 0.88 },
    };
    // 1000 * 162 * 1.0 * 1.0 (invoiceFactor ignored) = 162000
    expect(computeMonthlyCost(input)).toBeCloseTo(162000);
  });

  it("external monthly: applies invoiceFactor", () => {
    const input: AllocationInput = {
      allocationPct: 1.0,
      employmentType: "external",
      workingHoursNorm,
      rateCard: { costBasis: "monthly", monthlyRateNok: 100000, invoiceFactor: 0.88 },
    };
    expect(computeMonthlyCost(input)).toBeCloseTo(88000);
  });

  it("internal monthly: ignores invoiceFactor", () => {
    const input: AllocationInput = {
      allocationPct: 1.0,
      employmentType: "internal",
      workingHoursNorm,
      rateCard: { costBasis: "monthly", monthlyRateNok: 100000, invoiceFactor: 0.88 },
    };
    expect(computeMonthlyCost(input)).toBeCloseTo(100000);
  });

  it("resource 50/50 across two teams: each team pays half", () => {
    const base: AllocationInput = {
      allocationPct: 0.5,
      employmentType: "external",
      workingHoursNorm,
      rateCard: { costBasis: "hourly", hourlyRateNok: 1000, invoiceFactor: 1.0 },
    };
    const costPerTeam = computeMonthlyCost(base);
    // 1000 * 162 * 0.5 = 81000 each
    expect(costPerTeam).toBeCloseTo(81000);
    // Total across both teams = full-time cost
    expect(costPerTeam * 2).toBeCloseTo(162000);
  });

  it("uses hourlyRateNok=0 when not set", () => {
    const input: AllocationInput = {
      allocationPct: 1.0,
      employmentType: "external",
      workingHoursNorm,
      rateCard: { costBasis: "hourly" },
    };
    expect(computeMonthlyCost(input)).toBe(0);
  });
});

// ─── detectOverbooking ─────────────────────────────────────────────────────

describe("detectOverbooking", () => {
  it("detects overbooking when total > 1.0", () => {
    const result = detectOverbooking([
      { teamId: "t1", allocationPct: 0.6 },
      { teamId: "t2", allocationPct: 0.6 },
    ]);
    expect(result.isOverbooked).toBe(true);
    expect(result.totalPct).toBeCloseTo(1.2);
  });

  it("no overbooking at exactly 1.0", () => {
    const result = detectOverbooking([
      { teamId: "t1", allocationPct: 0.5 },
      { teamId: "t2", allocationPct: 0.5 },
    ]);
    expect(result.isOverbooked).toBe(false);
    expect(result.totalPct).toBeCloseTo(1.0);
  });
});

// ─── computeAnnualSummary ──────────────────────────────────────────────────

describe("computeAnnualSummary", () => {
  it("annual cost equals sum of monthly costs", () => {
    const months: MonthlyEntry[] = Array.from({ length: 12 }, (_, i) => ({
      year: 2026,
      month: i + 1,
      costNok: 50000,
      fte: 1.0,
    }));
    const summary = computeAnnualSummary(months);
    expect(summary.totalCostNok).toBeCloseTo(600000);
  });

  it("annual FTE is average of monthly FTE values", () => {
    const months: MonthlyEntry[] = [
      { year: 2026, month: 1, costNok: 0, fte: 0.5 },
      { year: 2026, month: 2, costNok: 0, fte: 1.0 },
    ];
    const summary = computeAnnualSummary(months);
    expect(summary.totalFTE).toBeCloseTo(0.75);
  });

  it("returns zero FTE for empty input", () => {
    expect(computeAnnualSummary([]).totalFTE).toBe(0);
  });
});

// ─── resolveRateCard ───────────────────────────────────────────────────────

describe("resolveRateCard", () => {
  // Use local-time dates to avoid UTC/local timezone ambiguity in comparisons
  const base: RateCardPeriod = {
    effectiveFrom: new Date(2026, 0, 1),   // Jan 1
    effectiveTo: new Date(2026, 5, 1),     // Jun 1
    costBasis: "hourly",
    hourlyRateNok: 800,
  };
  const updated: RateCardPeriod = {
    effectiveFrom: new Date(2026, 5, 1),   // Jun 1
    effectiveTo: null,
    costBasis: "hourly",
    hourlyRateNok: 900,
  };

  it("returns correct rate card for a month before price change", () => {
    const rc = resolveRateCard([base, updated], 2026, 3);
    expect(rc?.hourlyRateNok).toBe(800);
  });

  it("returns updated rate card from the month of price change", () => {
    const rc = resolveRateCard([base, updated], 2026, 6);
    expect(rc?.hourlyRateNok).toBe(900);
  });

  it("returns null when no rate card covers the period", () => {
    const rc = resolveRateCard([base], 2025, 12);
    expect(rc).toBeNull();
  });

  it("returns rate card for January when effectiveFrom is UTC midnight (UI-entry pattern)", () => {
    const rc: RateCardPeriod = {
      effectiveFrom: new Date("2026-01-01"), // UTC midnight — slik UI lagrer det
      effectiveTo: null,
      costBasis: "hourly",
      hourlyRateNok: 1000,
    };
    expect(resolveRateCard([rc], 2026, 1)?.hourlyRateNok).toBe(1000);
  });
});

// ─── computeMonthlyFTE ─────────────────────────────────────────────────────

describe("computeMonthlyFTE", () => {
  it("sums allocation percentages", () => {
    expect(computeMonthlyFTE([
      { allocationPct: 0.5 },
      { allocationPct: 0.3 },
      { allocationPct: 0.2 },
    ])).toBeCloseTo(1.0);
  });
});
