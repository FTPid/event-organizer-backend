/*
  Warnings:

  - The values [Free,paid] on the enum `Event_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `event` MODIFY `type` ENUM('FREE', 'PAID') NOT NULL;
