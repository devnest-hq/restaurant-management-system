/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `InventoryItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[menuItemId,inventoryItemId]` on the table `MenuItemIngredient` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_name_key" ON "InventoryItem"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemIngredient_menuItemId_inventoryItemId_key" ON "MenuItemIngredient"("menuItemId", "inventoryItemId");
