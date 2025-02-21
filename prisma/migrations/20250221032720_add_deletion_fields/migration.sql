-- AlterTable
ALTER TABLE `user` ADD COLUMN `deletionScheduledAt` DATETIME(3) NULL,
    ADD COLUMN `lastLoginAt` DATETIME(3) NULL;
