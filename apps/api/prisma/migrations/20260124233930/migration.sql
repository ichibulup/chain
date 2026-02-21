/*
  Warnings:

  - You are about to drop the column `restaurantId` on the `Supplier` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_restaurantId_fkey";

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "restaurantId";
