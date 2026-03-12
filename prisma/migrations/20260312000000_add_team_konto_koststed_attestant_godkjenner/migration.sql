-- AlterTable
ALTER TABLE "Team" ADD COLUMN "konto"        INTEGER;
ALTER TABLE "Team" ADD COLUMN "koststed"     INTEGER;
ALTER TABLE "Team" ADD COLUMN "attestantId"  TEXT;
ALTER TABLE "Team" ADD COLUMN "godkjennerId" TEXT;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_attestantId_fkey"
  FOREIGN KEY ("attestantId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_godkjennerId_fkey"
  FOREIGN KEY ("godkjennerId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
