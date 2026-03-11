-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "teamLeadId" TEXT;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_teamLeadId_fkey" FOREIGN KEY ("teamLeadId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
