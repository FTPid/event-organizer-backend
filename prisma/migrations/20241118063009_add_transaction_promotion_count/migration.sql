/*
  Warnings:

  - Added the required column `usedCount` to the `Promotion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `promotion` ADD COLUMN `usageLimit` INTEGER NULL,
    ADD COLUMN `usedCount` INTEGER NOT NULL;
