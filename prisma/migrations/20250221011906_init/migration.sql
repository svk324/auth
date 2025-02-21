/*
  Warnings:

  - Made the column `provider` on table `email` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `email` MODIFY `provider` VARCHAR(191) NOT NULL;
