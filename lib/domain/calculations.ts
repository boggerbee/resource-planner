/**
 * Domain calculations for resource planning.
 * Pure functions — no UI dependencies, no database calls.
 * All monetary values are in NOK.
 * allocationPct is always 0.0–1.0.
 */

export interface RateCardInput {
  costBasis: "hourly" | "monthly";
  hourlyRateNok?: number | null;
  monthlyRateNok?: number | null;
  vatPct?: number | null;
  invoiceFactor?: number | null;
}

export interface AllocationInput {
  allocationPct: number; // 0.0–1.0
  rateCard: RateCardInput;
  employmentType: "internal" | "external";
  workingHoursNorm: number;
}

export interface MonthlyFTEResult {
  totalFTE: number;
  byResource: Record<string, number>;
}

export interface OverbookingResult {
  isOverbooked: boolean;
  totalPct: number;
  byTeam: Record<string, number>;
}

// ─── Basic calculations ────────────────────────────────────────────────────

/**
 * Compute hours allocated for a resource in a period.
 */
export function computeAllocationHours(
  allocationPct: number,
  workingHoursNorm: number
): number {
  return workingHoursNorm * allocationPct;
}

/**
 * Compute FTE for a set of allocations in a period.
 * FTE = sum of allocationPct values.
 */
export function computeMonthlyFTE(allocations: { allocationPct: number }[]): number {
  return allocations.reduce((sum, a) => sum + a.allocationPct, 0);
}

/**
 * Compute monthly cost for a single allocation.
 *
 * External (hourly): hourlyRate × workingHoursNorm × allocationPct × invoiceFactor
 * External (monthly): monthlyRate × allocationPct × invoiceFactor
 * Internal (hourly):  hourlyRate × workingHoursNorm × allocationPct
 * Internal (monthly): monthlyRate × allocationPct
 *
 * VAT is not included in cost — it's a pass-through for reporting purposes.
 */
export function computeMonthlyCost(input: AllocationInput): number {
  const { allocationPct, rateCard, employmentType, workingHoursNorm } = input;
  const invoiceFactor =
    employmentType === "external" ? (rateCard.invoiceFactor ?? 1.0) : 1.0;

  if (rateCard.costBasis === "monthly") {
    const rate = rateCard.monthlyRateNok ?? 0;
    return rate * allocationPct * invoiceFactor;
  }

  // hourly (default)
  const rate = rateCard.hourlyRateNok ?? 0;
  return rate * workingHoursNorm * allocationPct * invoiceFactor;
}

/**
 * Compute VAT amount for a monthly cost (for external resources only).
 */
export function computeMonthlyVat(
  monthlyCost: number,
  vatPct: number | null | undefined
): number {
  if (!vatPct) return 0;
  return monthlyCost * vatPct;
}

// ─── Overbooking detection ─────────────────────────────────────────────────

export interface AllocationByTeam {
  teamId: string;
  allocationPct: number;
}

/**
 * Detect whether a resource is overbooked in a given period.
 * Overbooking = sum of allocationPct across all teams > 1.0.
 */
export function detectOverbooking(
  allocations: AllocationByTeam[]
): OverbookingResult {
  const byTeam: Record<string, number> = {};
  let totalPct = 0;

  for (const a of allocations) {
    byTeam[a.teamId] = (byTeam[a.teamId] ?? 0) + a.allocationPct;
    totalPct += a.allocationPct;
  }

  return {
    isOverbooked: totalPct > 1.0,
    totalPct,
    byTeam,
  };
}

// ─── Annual summary ────────────────────────────────────────────────────────

export interface MonthlyEntry {
  year: number;
  month: number;
  costNok: number;
  fte: number;
}

export interface AnnualSummary {
  totalCostNok: number;
  totalFTE: number;
  byMonth: MonthlyEntry[];
}

/**
 * Aggregate monthly entries into an annual summary.
 * Annual cost = sum of monthly costs.
 * Annual FTE = average of monthly FTE values.
 */
export function computeAnnualSummary(monthlyEntries: MonthlyEntry[]): AnnualSummary {
  const totalCostNok = monthlyEntries.reduce((s, e) => s + e.costNok, 0);
  const totalFTE =
    monthlyEntries.length > 0
      ? monthlyEntries.reduce((s, e) => s + e.fte, 0) / monthlyEntries.length
      : 0;

  return {
    totalCostNok,
    totalFTE,
    byMonth: monthlyEntries,
  };
}

// ─── Rate card resolution ──────────────────────────────────────────────────

export interface RateCardPeriod {
  effectiveFrom: Date;
  effectiveTo: Date | null;
  costBasis: "hourly" | "monthly";
  hourlyRateNok?: number | null;
  monthlyRateNok?: number | null;
  vatPct?: number | null;
  invoiceFactor?: number | null;
}

/**
 * Find the rate card valid for a given year+month.
 * Returns the most recently effective rate card that covers the period.
 */
export function resolveRateCard(
  rateCards: RateCardPeriod[],
  year: number,
  month: number
): RateCardPeriod | null {
  const periodStart = new Date(year, month - 1, 1);

  const valid = rateCards.filter((rc) => {
    const from = rc.effectiveFrom;
    const to = rc.effectiveTo;
    return (
      from <= periodStart && (to === null || to > periodStart)
    );
  });

  if (valid.length === 0) return null;

  // Return the most recently effective
  return valid.sort(
    (a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime()
  )[0];
}
