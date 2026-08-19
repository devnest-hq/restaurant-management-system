-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "imagePublicId" TEXT;

-- CreateTable
CREATE TABLE "MenuItemIngredient" (
    "id" SERIAL NOT NULL,
    "quantityUsed" INTEGER NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "inventoryItemId" INTEGER NOT NULL,

    CONSTRAINT "MenuItemIngredient_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MenuItemIngredient" ADD CONSTRAINT "MenuItemIngredient_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemIngredient" ADD CONSTRAINT "MenuItemIngredient_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
