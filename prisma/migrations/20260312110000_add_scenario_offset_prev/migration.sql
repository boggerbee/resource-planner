ALTER TABLE "Scenario" ADD COLUMN "externalCostOffsetMonths" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Scenario" ADD COLUMN "prevScenarioId" TEXT;

ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_prevScenarioId_fkey"
  FOREIGN KEY ("prevScenarioId") REFERENCES "Scenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Kun ett approved-scenario per år (safety net i tillegg til applikasjonslogikk)
CREATE UNIQUE INDEX "Scenario_year_approved_unique"
  ON "Scenario"("year") WHERE "status" = 'approved';
