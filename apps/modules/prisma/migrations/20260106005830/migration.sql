/*
  Warnings:

  - The `status` column on the `WarehouseTransfer` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "WarehouseTransferStatus" AS ENUM ('draft', 'pending', 'approved', 'completed', 'cancelled');

-- AlterTable
ALTER TABLE "WarehouseTransfer" DROP COLUMN "status",
ADD COLUMN     "status" "WarehouseTransferStatus" NOT NULL DEFAULT 'draft';
