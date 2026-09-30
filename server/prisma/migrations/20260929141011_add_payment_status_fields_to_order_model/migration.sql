-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'REFUND_FAILED', 'DISPUTED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "gatewayPaymentId" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "refundAmount" DECIMAL(10,2),
ADD COLUMN     "refundId" TEXT;
