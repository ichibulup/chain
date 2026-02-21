/*
  Warnings:

  - You are about to drop the column `category` on the `InventoryItem` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "InventoryItem_category_idx";

-- AlterTable
ALTER TABLE "InventoryItem" DROP COLUMN "category",
ADD COLUMN     "categoryId" TEXT;

-- CreateIndex
CREATE INDEX "InventoryItem_categoryId_idx" ON "InventoryItem"("categoryId");

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
