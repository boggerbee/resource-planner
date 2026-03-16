-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "department" TEXT;

-- AlterTable
ALTER TABLE "SystemSettings" ALTER COLUMN "updatedAt" DROP DEFAULT;
