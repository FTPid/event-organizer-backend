/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `role` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('ADMIN', 'CUSTOMER', 'ORGANIZER') NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_referralCode_key` ON `User`(`referralCode`);
