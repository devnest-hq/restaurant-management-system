jest.mock("../../prisma/client", () =>
  require("../../prisma/client.mock")
);

const prismaMock = require("../../prisma/client.mock");
const ingredientService = require("../../services/menuItemIngredient.service");

describe("menuItemIngredient.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addIngredientsToMenuItem", () => {
    it("rejects an invalid menu item ID", async () => {
      await expect(
        ingredientService.addIngredientsToMenuItem("abc", [
          {
            inventoryItemId: 1,
            quantityUsed: 2,
          },
        ])
      ).rejects.toThrow("Invalid menu item ID");
    });

    it("rejects when ingredients is not an array", async () => {
      await expect(
        ingredientService.addIngredientsToMenuItem(1, {})
      ).rejects.toThrow("Ingredients must be a non-empty array");
    });

    it("rejects an empty ingredients array", async () => {
      await expect(
        ingredientService.addIngredientsToMenuItem(1, [])
      ).rejects.toThrow("Ingredients must be a non-empty array");
    });

    it("throws when the menu item does not exist", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue(null);

      await expect(
        ingredientService.addIngredientsToMenuItem(99, [
          {
            inventoryItemId: 1,
            quantityUsed: 2,
          },
        ])
      ).rejects.toThrow("Menu item not found");

      expect(prismaMock.menuItem.findUnique).toHaveBeenCalledWith({
        where: { id: 99 },
      });
    });

    it("rejects an ingredient without inventoryItemId", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue({
        id: 1,
        name: "Tomato Stew",
      });

      await expect(
        ingredientService.addIngredientsToMenuItem(1, [
          {
            quantityUsed: 2,
          },
        ])
      ).rejects.toThrow(
        "Each ingredient must have inventoryItemId and quantityUsed"
      );
    });

    it("rejects an ingredient without quantityUsed", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue({
        id: 1,
        name: "Tomato Stew",
      });

      await expect(
        ingredientService.addIngredientsToMenuItem(1, [
          {
            inventoryItemId: 5,
          },
        ])
      ).rejects.toThrow(
        "Each ingredient must have inventoryItemId and quantityUsed"
      );
    });

    it("rejects a non-integer inventoryItemId", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue({
        id: 1,
        name: "Tomato Stew",
      });

      await expect(
        ingredientService.addIngredientsToMenuItem(1, [
          {
            inventoryItemId: 1.5,
            quantityUsed: 2,
          },
        ])
      ).rejects.toThrow(
        "inventoryItemId and quantityUsed must be integers"
      );
    });

    it("rejects a non-integer quantityUsed", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue({
        id: 1,
        name: "Tomato Stew",
      });

      await expect(
        ingredientService.addIngredientsToMenuItem(1, [
          {
            inventoryItemId: 1,
            quantityUsed: 2.5,
          },
        ])
      ).rejects.toThrow(
        "inventoryItemId and quantityUsed must be integers"
      );
    });

    it("rejects quantityUsed of zero", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue({
        id: 1,
        name: "Tomato Stew",
      });

      await expect(
        ingredientService.addIngredientsToMenuItem(1, [
          {
            inventoryItemId: 1,
            quantityUsed: 0,
          },
        ])
      ).rejects.toThrow("quantityUsed must be greater than 0");
    });

    it("rejects a negative quantityUsed", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue({
        id: 1,
        name: "Tomato Stew",
      });

      await expect(
        ingredientService.addIngredientsToMenuItem(1, [
          {
            inventoryItemId: 1,
            quantityUsed: -5,
          },
        ])
      ).rejects.toThrow("quantityUsed must be greater than 0");
    });

    it("throws when an inventory item does not exist", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue({
        id: 1,
        name: "Tomato Stew",
      });

      prismaMock.inventoryItem.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Tomato",
        },
      ]);

      await expect(
        ingredientService.addIngredientsToMenuItem(1, [
          {
            inventoryItemId: 1,
            quantityUsed: 2,
          },
          {
            inventoryItemId: 99,
            quantityUsed: 3,
          },
        ])
      ).rejects.toThrow("Inventory item(s) not found: 99");
    });

    it("reports multiple missing inventory items", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue({
        id: 1,
        name: "Tomato Stew",
      });

      prismaMock.inventoryItem.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Tomato",
        },
      ]);

      await expect(
        ingredientService.addIngredientsToMenuItem(1, [
          {
            inventoryItemId: 1,
            quantityUsed: 2,
          },
          {
            inventoryItemId: 50,
            quantityUsed: 3,
          },
          {
            inventoryItemId: 60,
            quantityUsed: 1,
          },
        ])
      ).rejects.toThrow("Inventory item(s) not found: 50, 60");
    });

    it("creates a single ingredient relationship successfully", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue({
        id: 1,
        name: "Tomato Stew",
      });

      prismaMock.inventoryItem.findMany.mockResolvedValue([
        {
          id: 5,
          name: "Tomato",
        },
      ]);

      prismaMock.menuItemIngredient.createMany.mockResolvedValue({
        count: 1,
      });

      const result =
        await ingredientService.addIngredientsToMenuItem(1, [
          {
            inventoryItemId: 5,
            quantityUsed: 2,
          },
        ]);

      expect(result).toEqual({ count: 1 });

      expect(prismaMock.menuItemIngredient.createMany).toHaveBeenCalledWith({
        data: [
          {
            menuItemId: 1,
            inventoryItemId: 5,
            quantityUsed: 2,
          },
        ],
      });
    });

    it("creates multiple ingredient relationships successfully", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue({
        id: 1,
        name: "Tomato Stew",
      });

      prismaMock.inventoryItem.findMany.mockResolvedValue([
        { id: 5, name: "Tomato" },
        { id: 6, name: "Onion" },
        { id: 7, name: "Cooking Oil" },
      ]);

      prismaMock.menuItemIngredient.createMany.mockResolvedValue({
        count: 3,
      });

      const ingredients = [
        {
          inventoryItemId: 5,
          quantityUsed: 2,
        },
        {
          inventoryItemId: 6,
          quantityUsed: 1,
        },
        {
          inventoryItemId: 7,
          quantityUsed: 3,
        },
      ];

      const result =
        await ingredientService.addIngredientsToMenuItem(1, ingredients);

      expect(result).toEqual({ count: 3 });

      expect(
        prismaMock.menuItemIngredient.createMany
      ).toHaveBeenCalledWith({
        data: [
          {
            menuItemId: 1,
            inventoryItemId: 5,
            quantityUsed: 2,
          },
          {
            menuItemId: 1,
            inventoryItemId: 6,
            quantityUsed: 1,
          },
          {
            menuItemId: 1,
            inventoryItemId: 7,
            quantityUsed: 3,
          },
        ],
      });
    });

    it("uses the menu item ID from the URL for every ingredient", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue({
        id: 10,
        name: "Fried Rice",
      });

      prismaMock.inventoryItem.findMany.mockResolvedValue([
        { id: 20, name: "Rice" },
        { id: 21, name: "Oil" },
      ]);

      prismaMock.menuItemIngredient.createMany.mockResolvedValue({
        count: 2,
      });

      await ingredientService.addIngredientsToMenuItem(10, [
        {
          inventoryItemId: 20,
          quantityUsed: 5,
        },
        {
          inventoryItemId: 21,
          quantityUsed: 2,
        },
      ]);

      expect(
        prismaMock.menuItemIngredient.createMany
      ).toHaveBeenCalledWith({
        data: [
          {
            menuItemId: 10,
            inventoryItemId: 20,
            quantityUsed: 5,
          },
          {
            menuItemId: 10,
            inventoryItemId: 21,
            quantityUsed: 2,
          },
        ],
      });
    });

    it("checks all inventory items before creating relationships", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue({
        id: 1,
      });

      prismaMock.inventoryItem.findMany.mockResolvedValue([
        { id: 5 },
        { id: 6 },
      ]);

      prismaMock.menuItemIngredient.createMany.mockResolvedValue({
        count: 2,
      });

      await ingredientService.addIngredientsToMenuItem(1, [
        {
          inventoryItemId: 5,
          quantityUsed: 2,
        },
        {
          inventoryItemId: 6,
          quantityUsed: 1,
        },
      ]);

      expect(
        prismaMock.inventoryItem.findMany
      ).toHaveBeenCalledWith({
        where: {
          id: {
            in: [5, 6],
          },
        },
      });
    });

    it("propagates Prisma P2002 duplicate relationship errors", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue({
        id: 1,
        name: "Tomato Stew",
      });

      prismaMock.inventoryItem.findMany.mockResolvedValue([
        {
          id: 5,
          name: "Tomato",
        },
      ]);

      const prismaError = new Error(
        "Unique constraint failed on the fields: (`menuItemId`,`inventoryItemId`)"
      );
      prismaError.code = "P2002";

      prismaMock.menuItemIngredient.createMany.mockRejectedValue(
        prismaError
      );

      await expect(
        ingredientService.addIngredientsToMenuItem(1, [
          {
            inventoryItemId: 5,
            quantityUsed: 2,
          },
        ])
      ).rejects.toMatchObject({
        code: "P2002",
      });
    });

    it("propagates unexpected database errors", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue({
        id: 1,
        name: "Tomato Stew",
      });

      prismaMock.inventoryItem.findMany.mockResolvedValue([
        {
          id: 5,
          name: "Tomato",
        },
      ]);

      const databaseError = new Error("Database connection failed");

      prismaMock.menuItemIngredient.createMany.mockRejectedValue(
        databaseError
      );

      await expect(
        ingredientService.addIngredientsToMenuItem(1, [
          {
            inventoryItemId: 5,
            quantityUsed: 2,
          },
        ])
      ).rejects.toThrow("Database connection failed");
    });
  });
});