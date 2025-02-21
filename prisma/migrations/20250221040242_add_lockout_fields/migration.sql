-- AlterTable
ALTER TABLE `user` ADD COLUMN `failedLoginAttempts` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lastFailedLogin` DATETIME(3) NULL,
    ADD COLUMN `lockoutUntil` DATETIME(3) NULL;
