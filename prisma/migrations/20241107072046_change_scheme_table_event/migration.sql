/*
  Warnings:

  - You are about to drop the column `ticketId` on the `event` table. All the data in the column will be lost.
  - Added the required column `type` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `event` DROP FOREIGN KEY `Event_ticketId_fkey`;

-- AlterTable
ALTER TABLE `event` DROP COLUMN `ticketId`,
    ADD COLUMN `type` ENUM('Free', 'paid') NOT NULL,
    MODIFY `price` INTEGER NULL;

-- CreateTable
CREATE TABLE `_EventToTicket` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_EventToTicket_AB_unique`(`A`, `B`),
    INDEX `_EventToTicket_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_EventToTicket` ADD CONSTRAINT `_EventToTicket_A_fkey` FOREIGN KEY (`A`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventToTicket` ADD CONSTRAINT `_EventToTicket_B_fkey` FOREIGN KEY (`B`) REFERENCES `Ticket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
