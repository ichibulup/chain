-- DropForeignKey
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_restaurantId_fkey";

-- DropIndex
DROP INDEX "Supplier_restaurantId_idx";

-- AlterTable
ALTER TABLE "Supplier" ALTER COLUMN "restaurantId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Supplier_organizationId_idx" ON "Supplier"("organizationId");

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
