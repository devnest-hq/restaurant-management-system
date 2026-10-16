-- DropIndex
DROP INDEX "Reservation_tableId_date_timeSlot_key";

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" INTEGER;

CREATE UNIQUE INDEX "Reservation_active_slot_key" ON "Reservation" ("tableId", "date", "timeSlot") WHERE "status" <> 'CANCELLED';