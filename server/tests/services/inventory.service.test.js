jest.mock("../../prisma/client", () =>
  require("../../prisma/client.mock")
);

jest.mock("../../services/notification.service", () => ({
  notifyRoles: jest.fn().mockResolvedValue(undefined),
}));

const prismaMock = require("../../prisma/client.mock");
const inventoryService = require("../../services/inventory.service");
const { notifyRoles } = require("../../services/notification.service");

describe("inventory.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================
  // createInventoryItem
  // =========================================================

  describe("createInventoryItem", () => {
    it("rejects when name is missing", async () => {
      await expect(
        inventoryService.createInventoryItem({
          quantity: 10,
          unit: "kg",
          lowStockThreshold: 2,
          supplier: "ABC Foods",
        })
      ).rejects.toThrow("All fields are required");

      expect(prismaMock.inventoryItem.create).not.toHaveBeenCalled();
    });

    it("rejects when unit is missing", async () => {
      await expect(
        inventoryService.createInventoryItem({
          name: "Rice",
          quantity: 10,
          lowStockThreshold: 2,
          supplier: "ABC Foods",
        })
      ).rejects.toThrow("All fields are required");

      expect(prismaMock.inventoryItem.create).not.toHaveBeenCalled();
    });

    it("rejects a negative quantity", async () => {
      await expect(
        inventoryService.createInventoryItem({
          name: "Rice",
          quantity: -10,
          unit: "kg",
          lowStockThreshold: 2,
          supplier: "ABC Foods",
        })
      ).rejects.toThrow(
        "Quantity and low stock threshold must be non-negative"
      );

      expect(prismaMock.inventoryItem.create).not.toHaveBeenCalled();
    });

    it("rejects a negative low stock threshold", async () => {
      await expect(
        inventoryService.createInventoryItem({
          name: "Rice",
          quantity: 10,
          unit: "kg",
          lowStockThreshold: -2,
          supplier: "ABC Foods",
        })
      ).rejects.toThrow(
        "Quantity and low stock threshold must be non-negative"
      );

      expect(prismaMock.inventoryItem.create).not.toHaveBeenCalled();
    });

    it("rejects a non-string name", async () => {
      await expect(
        inventoryService.createInventoryItem({
          name: 123,
          quantity: 10,
          unit: "kg",
          lowStockThreshold: 2,
          supplier: "ABC Foods",
        })
      ).rejects.toThrow("Name, unit, and supplier must be strings");
    });

    it("rejects a non-string unit", async () => {
      await expect(
        inventoryService.createInventoryItem({
          name: "Rice",
          quantity: 10,
          unit: 123,
          lowStockThreshold: 2,
          supplier: "ABC Foods",
        })
      ).rejects.toThrow("Name, unit, and supplier must be strings");
    });

    it("rejects a non-number quantity", async () => {
      await expect(
        inventoryService.createInventoryItem({
          name: "Rice",
          quantity: "10",
          unit: "kg",
          lowStockThreshold: 2,
          supplier: "ABC Foods",
        })
      ).rejects.toThrow(
        "Quantity and low stock threshold must be numbers"
      );
    });

    it("rejects a non-number low stock threshold", async () => {
      await expect(
        inventoryService.createInventoryItem({
          name: "Rice",
          quantity: 10,
          unit: "kg",
          lowStockThreshold: "2",
          supplier: "ABC Foods",
        })
      ).rejects.toThrow(
        "Quantity and low stock threshold must be numbers"
      );
    });

    it("creates an inventory item successfully", async () => {
      const inventoryItem = {
        id: 1,
        name: "Rice",
        quantity: 50,
        unit: "kg",
        lowStockThreshold: 10,
        supplier: "ABC Food Supplies",
      };

      prismaMock.inventoryItem.create.mockResolvedValue(inventoryItem);

      const result = await inventoryService.createInventoryItem({
        name: "Rice",
        quantity: 50,
        unit: "kg",
        lowStockThreshold: 10,
        supplier: "ABC Food Supplies",
      });

      expect(prismaMock.inventoryItem.create).toHaveBeenCalledWith({
        data: {
          name: "Rice",
          quantity: 50,
          unit: "kg",
          lowStockThreshold: 10,
          supplier: "ABC Food Supplies",
        },
      });

      expect(result).toEqual(inventoryItem);
    });

    it("allows supplier to be omitted", async () => {
      const inventoryItem = {
        id: 2,
        name: "Tomato",
        quantity: 50,
        unit: "pcs",
        lowStockThreshold: 10,
        supplier: null,
      };

      prismaMock.inventoryItem.create.mockResolvedValue(inventoryItem);

      const result = await inventoryService.createInventoryItem({
        name: "Tomato",
        quantity: 50,
        unit: "pcs",
        lowStockThreshold: 10,
      });

      expect(prismaMock.inventoryItem.create).toHaveBeenCalledWith({
        data: {
          name: "Tomato",
          quantity: 50,
          unit: "pcs",
          lowStockThreshold: 10,
          supplier: undefined,
        },
      });

      expect(result).toEqual(inventoryItem);
    });
  });

  // =========================================================
  // createInventoryItems
  // =========================================================

  describe("createInventoryItems", () => {
    it("rejects when items is not an array", async () => {
      await expect(
        inventoryService.createInventoryItems({})
      ).rejects.toThrow("Items must be a non-empty array");

      expect(prismaMock.inventoryItem.createMany).not.toHaveBeenCalled();
    });

    it("rejects an empty array", async () => {
      await expect(
        inventoryService.createInventoryItems([])
      ).rejects.toThrow("Items must be a non-empty array");

      expect(prismaMock.inventoryItem.createMany).not.toHaveBeenCalled();
    });

    it("rejects an item with no name", async () => {
      await expect(
        inventoryService.createInventoryItems([
          {
            quantity: 10,
            unit: "kg",
            lowStockThreshold: 2,
            supplier: "ABC Foods",
          },
        ])
      ).rejects.toThrow("Name and unit are required for every item");
    });

    it("rejects an item with no unit", async () => {
      await expect(
        inventoryService.createInventoryItems([
          {
            name: "Rice",
            quantity: 10,
            lowStockThreshold: 2,
            supplier: "ABC Foods",
          },
        ])
      ).rejects.toThrow("Name and unit are required for every item");
    });

    it("rejects non-string name or unit", async () => {
      await expect(
        inventoryService.createInventoryItems([
          {
            name: 123,
            quantity: 10,
            unit: "kg",
            lowStockThreshold: 2,
          },
        ])
      ).rejects.toThrow("Name and unit must be strings");
    });

    it("rejects non-number quantity", async () => {
      await expect(
        inventoryService.createInventoryItems([
          {
            name: "Rice",
            quantity: "10",
            unit: "kg",
            lowStockThreshold: 2,
          },
        ])
      ).rejects.toThrow(
        "Quantity and low stock threshold must be numbers"
      );
    });

    it("rejects non-number low stock threshold", async () => {
      await expect(
        inventoryService.createInventoryItems([
          {
            name: "Rice",
            quantity: 10,
            unit: "kg",
            lowStockThreshold: "2",
          },
        ])
      ).rejects.toThrow(
        "Quantity and low stock threshold must be numbers"
      );
    });

    it("rejects negative quantity", async () => {
      await expect(
        inventoryService.createInventoryItems([
          {
            name: "Rice",
            quantity: -10,
            unit: "kg",
            lowStockThreshold: 2,
          },
        ])
      ).rejects.toThrow(
        "Quantity and low stock threshold must be non-negative"
      );
    });

    it("rejects negative low stock threshold", async () => {
      await expect(
        inventoryService.createInventoryItems([
          {
            name: "Rice",
            quantity: 10,
            unit: "kg",
            lowStockThreshold: -2,
          },
        ])
      ).rejects.toThrow(
        "Quantity and low stock threshold must be non-negative"
      );
    });

    it("rejects a non-string supplier", async () => {
      await expect(
        inventoryService.createInventoryItems([
          {
            name: "Rice",
            quantity: 10,
            unit: "kg",
            lowStockThreshold: 2,
            supplier: 123,
          },
        ])
      ).rejects.toThrow("Supplier must be a string");
    });

    it("allows supplier to be null", async () => {
      const items = [
        {
          name: "Rice",
          quantity: 50,
          unit: "kg",
          lowStockThreshold: 10,
          supplier: null,
        },
      ];

      prismaMock.inventoryItem.createMany.mockResolvedValue({
        count: 1,
      });

      const result =
        await inventoryService.createInventoryItems(items);

      expect(prismaMock.inventoryItem.createMany).toHaveBeenCalledWith({
        data: items,
      });

      expect(result).toEqual({ count: 1 });
    });

    it("creates multiple inventory items successfully", async () => {
      const items = [
        {
          name: "Rice",
          quantity: 50,
          unit: "kg",
          lowStockThreshold: 10,
          supplier: "ABC Foods",
        },
        {
          name: "Tomato",
          quantity: 100,
          unit: "pcs",
          lowStockThreshold: 20,
          supplier: "Green Valley Farms",
        },
        {
          name: "Cooking Oil",
          quantity: 30,
          unit: "ltr",
          lowStockThreshold: 5,
          supplier: "Prime Supplies",
        },
      ];

      prismaMock.inventoryItem.createMany.mockResolvedValue({
        count: 3,
      });

      const result =
        await inventoryService.createInventoryItems(items);

      expect(prismaMock.inventoryItem.createMany).toHaveBeenCalledWith({
        data: items,
      });

      expect(result).toEqual({ count: 3 });
    });
  });

  // =========================================================
  // getAllInventoryItems
  // =========================================================

  describe("getAllInventoryItems", () => {
    it("returns all inventory items ordered by updatedAt descending", async () => {
      const items = [
        {
          id: 2,
          name: "Tomato",
          quantity: 50,
          unit: "pcs",
        },
        {
          id: 1,
          name: "Rice",
          quantity: 50,
          unit: "kg",
        },
      ];

      prismaMock.inventoryItem.findMany.mockResolvedValue(items);

      const result = await inventoryService.getAllInventoryItems();

      expect(prismaMock.inventoryItem.findMany).toHaveBeenCalledWith({
        orderBy: {
          updatedAt: "desc",
        },
      });

      expect(result).toEqual(items);
    });

    it("returns an empty array when inventory is empty", async () => {
      prismaMock.inventoryItem.findMany.mockResolvedValue([]);

      const result = await inventoryService.getAllInventoryItems();

      expect(result).toEqual([]);
    });
  });

  // =========================================================
  // getInventoryItemById
  // =========================================================

  describe("getInventoryItemById", () => {
    it("returns an inventory item by ID", async () => {
      const item = {
        id: 1,
        name: "Rice",
        quantity: 50,
        unit: "kg",
      };

      prismaMock.inventoryItem.findUnique.mockResolvedValue(item);

      const result =
        await inventoryService.getInventoryItemById("1");

      expect(prismaMock.inventoryItem.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(result).toEqual(item);
    });

    it("returns null when the inventory item does not exist", async () => {
      prismaMock.inventoryItem.findUnique.mockResolvedValue(null);

      const result =
        await inventoryService.getInventoryItemById(99);

      expect(result).toBeNull();
    });

    it("parses string IDs into integers", async () => {
      prismaMock.inventoryItem.findUnique.mockResolvedValue({
        id: 5,
      });

      await inventoryService.getInventoryItemById("5");

      expect(prismaMock.inventoryItem.findUnique).toHaveBeenCalledWith({
        where: {
          id: 5,
        },
      });
    });
  });

  // =========================================================
  // getLowStockItems
  // =========================================================

  describe("getLowStockItems", () => {
    it("returns inventory items at or below their low stock threshold", async () => {
      const lowStockItems = [
        {
          id: 1,
          name: "Rice",
          quantity: 8,
          unit: "kg",
          lowStockThreshold: 10,
        },
        {
          id: 2,
          name: "Tomato",
          quantity: 10,
          unit: "pcs",
          lowStockThreshold: 10,
        },
      ];

      prismaMock.$queryRaw.mockResolvedValue(lowStockItems);

      const result = await inventoryService.getLowStockItems();

      expect(prismaMock.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(lowStockItems);
    });

    it("returns an empty array when there are no low stock items", async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      const result = await inventoryService.getLowStockItems();

      expect(result).toEqual([]);
    });
  });

  // =========================================================
  // checkAndNotifyLowStock
  // =========================================================

  describe("checkAndNotifyLowStock", () => {
    it("does not notify when stock is above the threshold", async () => {
      const inventoryItem = {
        id: 1,
        name: "Rice",
        quantity: 20,
        unit: "kg",
        lowStockThreshold: 10,
      };

      await inventoryService.checkAndNotifyLowStock(inventoryItem);

      expect(notifyRoles).not.toHaveBeenCalled();
    });

    it("notifies ADMIN and CHEF when stock is below the threshold", async () => {
      const inventoryItem = {
        id: 1,
        name: "Rice",
        quantity: 5,
        unit: "kg",
        lowStockThreshold: 10,
      };

      await inventoryService.checkAndNotifyLowStock(inventoryItem);

      expect(notifyRoles).toHaveBeenCalledWith(
        ["ADMIN", "CHEF"],
        {
          type: "LOW_STOCK",
          message:
            "Rice is low in stock: 5 kg remaining. Please restock.",
        },
        prismaMock
      );
    });

    it("notifies when stock exactly equals the threshold", async () => {
      const inventoryItem = {
        id: 1,
        name: "Tomato",
        quantity: 10,
        unit: "pcs",
        lowStockThreshold: 10,
      };

      await inventoryService.checkAndNotifyLowStock(inventoryItem);

      expect(notifyRoles).toHaveBeenCalledWith(
        ["ADMIN", "CHEF"],
        {
          type: "LOW_STOCK",
          message:
            "Tomato is low in stock: 10 pcs remaining. Please restock.",
        },
        prismaMock
      );
    });
  });

  // =========================================================
  // updateInventoryItem
  // =========================================================

  describe("updateInventoryItem", () => {
    it("returns null when the inventory item does not exist", async () => {
      prismaMock.inventoryItem.findUnique.mockResolvedValue(null);

      const result = await inventoryService.updateInventoryItem(99, {
        name: "Updated Rice",
      });

      expect(result).toBeNull();

      expect(prismaMock.inventoryItem.update).not.toHaveBeenCalled();
    });

    it("updates an inventory item successfully", async () => {
      const existingItem = {
        id: 1,
        name: "Rice",
        quantity: 50,
        unit: "kg",
        lowStockThreshold: 10,
        supplier: "ABC Foods",
      };

      const updatedItem = {
        ...existingItem,
        name: "Premium Rice",
        quantity: 100,
      };

      prismaMock.inventoryItem.findUnique.mockResolvedValue(
        existingItem
      );

      prismaMock.inventoryItem.update.mockResolvedValue(
        updatedItem
      );

      const result = await inventoryService.updateInventoryItem(1, {
        name: "Premium Rice",
        quantity: 100,
        unit: "kg",
        lowStockThreshold: 10,
        supplier: "ABC Foods",
      });

      expect(prismaMock.inventoryItem.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          name: "Premium Rice",
          quantity: 100,
          unit: "kg",
          lowStockThreshold: 10,
          supplier: "ABC Foods",
        },
      });

      expect(result).toEqual(updatedItem);
    });

    it("rejects negative quantity", async () => {
      prismaMock.inventoryItem.findUnique.mockResolvedValue({
        id: 1,
      });

      await expect(
        inventoryService.updateInventoryItem(1, {
          quantity: -5,
        })
      ).rejects.toThrow(
        "Quantity and low stock threshold must be non-negative"
      );

      expect(prismaMock.inventoryItem.update).not.toHaveBeenCalled();
    });

    it("rejects negative low stock threshold", async () => {
      prismaMock.inventoryItem.findUnique.mockResolvedValue({
        id: 1,
      });

      await expect(
        inventoryService.updateInventoryItem(1, {
          lowStockThreshold: -5,
        })
      ).rejects.toThrow(
        "Quantity and low stock threshold must be non-negative"
      );

      expect(prismaMock.inventoryItem.update).not.toHaveBeenCalled();
    });

    it("rejects a non-string name", async () => {
      prismaMock.inventoryItem.findUnique.mockResolvedValue({
        id: 1,
      });

      await expect(
        inventoryService.updateInventoryItem(1, {
          name: 123,
        })
      ).rejects.toThrow("Name and unit must be strings");
    });

    it("rejects a non-string unit", async () => {
      prismaMock.inventoryItem.findUnique.mockResolvedValue({
        id: 1,
      });

      await expect(
        inventoryService.updateInventoryItem(1, {
          unit: 123,
        })
      ).rejects.toThrow("Name and unit must be strings");
    });

    it("rejects a non-number quantity", async () => {
      prismaMock.inventoryItem.findUnique.mockResolvedValue({
        id: 1,
      });

      await expect(
        inventoryService.updateInventoryItem(1, {
          quantity: "50",
        })
      ).rejects.toThrow(
        "Quantity and low stock threshold must be numbers"
      );
    });

    it("rejects a non-number low stock threshold", async () => {
      prismaMock.inventoryItem.findUnique.mockResolvedValue({
        id: 1,
      });

      await expect(
        inventoryService.updateInventoryItem(1, {
          lowStockThreshold: "10",
        })
      ).rejects.toThrow(
        "Quantity and low stock threshold must be numbers"
      );
    });

    it("allows partial updates", async () => {
      const existingItem = {
        id: 1,
        name: "Rice",
        quantity: 50,
        unit: "kg",
        lowStockThreshold: 10,
        supplier: "ABC Foods",
      };

      const updatedItem = {
        ...existingItem,
        quantity: 75,
      };

      prismaMock.inventoryItem.findUnique.mockResolvedValue(
        existingItem
      );

      prismaMock.inventoryItem.update.mockResolvedValue(
        updatedItem
      );

      const result = await inventoryService.updateInventoryItem(1, {
        quantity: 75,
      });

      expect(prismaMock.inventoryItem.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          name: undefined,
          quantity: 75,
          unit: undefined,
          lowStockThreshold: undefined,
          supplier: undefined,
        },
      });

      expect(result).toEqual(updatedItem);
    });

    it("notifies ADMIN and CHEF when updated inventory is at or below low stock threshold", async () => {
      const existingItem = {
        id: 1,
        name: "Rice",
        quantity: 50,
        unit: "kg",
        lowStockThreshold: 10,
        supplier: "ABC Foods",
      };

      const updatedItem = {
        ...existingItem,
        quantity: 10,
      };

      prismaMock.inventoryItem.findUnique.mockResolvedValue(existingItem);
      prismaMock.inventoryItem.update.mockResolvedValue(updatedItem);

      await inventoryService.updateInventoryItem(1, {
        quantity: 10,
      });

      expect(notifyRoles).toHaveBeenCalledWith(
        ["ADMIN", "CHEF"],
        {
          type: "LOW_STOCK",
          message:
            "Rice is low in stock: 10 kg remaining. Please restock.",
        },
        prismaMock
      );
    });

    it("does not notify when updated inventory is above low stock threshold", async () => {
      const existingItem = {
        id: 1,
        name: "Rice",
        quantity: 50,
        unit: "kg",
        lowStockThreshold: 10,
        supplier: "ABC Foods",
      };

      const updatedItem = {
        ...existingItem,
        quantity: 20,
      };

      prismaMock.inventoryItem.findUnique.mockResolvedValue(existingItem);
      prismaMock.inventoryItem.update.mockResolvedValue(updatedItem);

      await inventoryService.updateInventoryItem(1, {
        quantity: 20,
      });

      expect(notifyRoles).not.toHaveBeenCalled();
    });

    it("notifies when quantity exactly equals the low stock threshold", async () => {
      const updatedItem = {
        id: 1,
        name: "Tomato",
        quantity: 10,
        unit: "pcs",
        lowStockThreshold: 10,
        supplier: "ABC Foods",
      };

      prismaMock.inventoryItem.findUnique.mockResolvedValue({
        ...updatedItem,
        quantity: 20,
      });

      prismaMock.inventoryItem.update.mockResolvedValue(updatedItem);

      await inventoryService.updateInventoryItem(1, {
        quantity: 10,
      });

      expect(notifyRoles).toHaveBeenCalledWith(
        ["ADMIN", "CHEF"],
        {
          type: "LOW_STOCK",
          message:
            "Tomato is low in stock: 10 pcs remaining. Please restock.",
        },
        prismaMock
      );
    });

    it("parses string IDs into integers", async () => {
      prismaMock.inventoryItem.findUnique.mockResolvedValue({
        id: 5,
      });

      prismaMock.inventoryItem.update.mockResolvedValue({
        id: 5,
        quantity: 100,
        lowStockThreshold: 10,
      });

      await inventoryService.updateInventoryItem("5", {
        quantity: 100,
      });

      expect(prismaMock.inventoryItem.findUnique).toHaveBeenCalledWith({
        where: {
          id: 5,
        },
      });

      expect(prismaMock.inventoryItem.update).toHaveBeenCalledWith({
        where: {
          id: 5,
        },
        data: {
          name: undefined,
          quantity: 100,
          unit: undefined,
          lowStockThreshold: undefined,
          supplier: undefined,
        },
      });
    });
  });

  // =========================================================
  // deleteInventoryItem
  // =========================================================

  describe("deleteInventoryItem", () => {
    it("returns null when the inventory item does not exist", async () => {
      prismaMock.inventoryItem.findUnique.mockResolvedValue(null);

      const result =
        await inventoryService.deleteInventoryItem(99);

      expect(result).toBeNull();

      expect(prismaMock.inventoryItem.delete).not.toHaveBeenCalled();
    });

    it("deletes an inventory item successfully", async () => {
      const item = {
        id: 1,
        name: "Rice",
        quantity: 50,
        unit: "kg",
      };

      prismaMock.inventoryItem.findUnique.mockResolvedValue(item);
      prismaMock.inventoryItem.delete.mockResolvedValue(item);

      const result =
        await inventoryService.deleteInventoryItem(1);

      expect(prismaMock.inventoryItem.delete).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(result).toEqual(item);
    });

    it("parses string IDs into integers", async () => {
      const item = {
        id: 5,
        name: "Tomato",
      };

      prismaMock.inventoryItem.findUnique.mockResolvedValue(item);
      prismaMock.inventoryItem.delete.mockResolvedValue(item);

      await inventoryService.deleteInventoryItem("5");

      expect(prismaMock.inventoryItem.findUnique).toHaveBeenCalledWith({
        where: {
          id: 5,
        },
      });

      expect(prismaMock.inventoryItem.delete).toHaveBeenCalledWith({
        where: {
          id: 5,
        },
      });
    });
  });
});