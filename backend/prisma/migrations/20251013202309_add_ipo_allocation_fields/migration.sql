-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "currentPrice" DECIMAL(10,2),
ADD COLUMN     "ipoShares" INTEGER,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "IpoWindow" ADD COLUMN     "allocationDate" TIMESTAMP(3),
ADD COLUMN     "allocationPrice" DECIMAL(10,2);
