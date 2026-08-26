-- AlterTable
ALTER TABLE "Reservation" ALTER COLUMN "date" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
