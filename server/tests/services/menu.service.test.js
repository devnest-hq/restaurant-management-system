jest.mock("../../prisma/client", () =>
  require("../../prisma/client.mock")
);

jest.mock("../../config/cloudinary", () => ({
  uploader: {
    destroy: jest.fn(),
  },
}));

jest.mock("../../utils/cache", () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
  deleteCachePattern: jest.fn(),
}));

const prismaMock = require("../../prisma/client.mock");
const cloudinary = require("../../config/cloudinary");
const {
  getCache,
  setCache,
  deleteCachePattern,
} = require("../../utils/cache");
const menuService = require("../../services/menu.service");

describe("menu.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Cache misses by default so database behavior can be tested.
    getCache.mockResolvedValue(null);
    setCache.mockResolvedValue(undefined);
    deleteCachePattern.mockResolvedValue(undefined);

    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  // =========================================================
  // createMenuItem
  // =========================================================

  describe("createMenuItem", () => {
    it("rejects when name is missing", async () => {
      await expect(
        menuService.createMenuItem({
          category: "Stew",
          price: 1000,
        })
      ).rejects.toThrow("All fields are required");

      expect(prismaMock.menuItem.create).not.toHaveBeenCalled();
    });

    it("rejects when category is missing", async () => {
      await expect(
        menuService.createMenuItem({
          name: "Tomato Stew",
          price: 1000,
        })
      ).rejects.toThrow("All fields are required");

      expect(prismaMock.menuItem.create).not.toHaveBeenCalled();
    });

    it("rejects when price is missing", async () => {
      await expect(
        menuService.createMenuItem({
          name: "Tomato Stew",
          category: "Stew",
        })
      ).rejects.toThrow("All fields are required");

      expect(prismaMock.menuItem.create).not.toHaveBeenCalled();
    });

    it("creates a menu item successfully", async () => {
      const menuItem = {
        id: 1,
        name: "Tomato Stew",
        category: "Stew",
        price: 1000,
        description: "Fresh tomato stew",
        imageUrl: null,
        imagePublicId: null,
        available: true,
      };

      prismaMock.menuItem.create.mockResolvedValue(menuItem);

      const result = await menuService.createMenuItem({
        name: "Tomato Stew",
        category: "Stew",
        price: 1000,
        description: "Fresh tomato stew",
      });

      expect(prismaMock.menuItem.create).toHaveBeenCalledWith({
        data: {
          name: "Tomato Stew",
          category: "Stew",
          price: 1000,
          description: "Fresh tomato stew",
          imageUrl: undefined,
          imagePublicId: undefined,
        },
      });

      expect(deleteCachePattern).toHaveBeenCalledWith("menu:*");
      expect(result).toEqual(menuItem);
    });

    it("creates a menu item with image information", async () => {
      prismaMock.menuItem.create.mockResolvedValue({
        id: 2,
        name: "Chicken Burger",
        category: "Burger",
        price: 2500,
        imageUrl: "https://cloudinary.com/image.jpg",
        imagePublicId: "restaurant/chicken-burger",
      });

      const result = await menuService.createMenuItem({
        name: "Chicken Burger",
        category: "Burger",
        price: 2500,
        description: "Chicken burger with cheese",
        imageUrl: "https://cloudinary.com/image.jpg",
        imagePublicId: "restaurant/chicken-burger",
      });

      expect(prismaMock.menuItem.create).toHaveBeenCalledWith({
        data: {
          name: "Chicken Burger",
          category: "Burger",
          price: 2500,
          description: "Chicken burger with cheese",
          imageUrl: "https://cloudinary.com/image.jpg",
          imagePublicId: "restaurant/chicken-burger",
        },
      });

      expect(deleteCachePattern).toHaveBeenCalledWith("menu:*");
      expect(result.name).toBe("Chicken Burger");
    });

    it("propagates database errors", async () => {
      prismaMock.menuItem.create.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        menuService.createMenuItem({
          name: "Tomato Stew",
          category: "Stew",
          price: 1000,
        })
      ).rejects.toThrow("Database error");

      expect(deleteCachePattern).not.toHaveBeenCalled();
    });
  });

  // =========================================================
  // updateMenuItem
  // =========================================================

  describe("updateMenuItem", () => {
    it("throws when menu item does not exist", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue(null);

      await expect(
        menuService.updateMenuItem(99, {
          name: "Updated Stew",
        })
      ).rejects.toThrow("Menu item not found");

      expect(prismaMock.menuItem.update).not.toHaveBeenCalled();
      expect(deleteCachePattern).not.toHaveBeenCalled();
    });

    it("updates a menu item successfully", async () => {
      const existingItem = {
        id: 1,
        name: "Tomato Stew",
        category: "Stew",
        price: 1000,
        imagePublicId: null,
      };

      const updatedItem = {
        ...existingItem,
        name: "Special Tomato Stew",
        price: 1500,
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);
      prismaMock.menuItem.update.mockResolvedValue(updatedItem);

      const result = await menuService.updateMenuItem(1, {
        name: "Special Tomato Stew",
        price: 1500,
        category: "Stew",
        description: "Special tomato stew",
        available: true,
      });

      expect(prismaMock.menuItem.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          name: "Special Tomato Stew",
          price: 1500,
          category: "Stew",
          available: true,
          description: "Special tomato stew",
          imageUrl: undefined,
          imagePublicId: undefined,
        },
      });

      expect(deleteCachePattern).toHaveBeenCalledWith("menu:*");
      expect(result).toEqual(updatedItem);
    });

    it("deletes the old Cloudinary image when a new image is provided", async () => {
      const existingItem = {
        id: 1,
        name: "Tomato Stew",
        category: "Stew",
        price: 1000,
        imagePublicId: "restaurant/old-image",
      };

      const updatedItem = {
        ...existingItem,
        imageUrl: "https://cloudinary.com/new-image.jpg",
        imagePublicId: "restaurant/new-image",
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);
      prismaMock.menuItem.update.mockResolvedValue(updatedItem);
      cloudinary.uploader.destroy.mockResolvedValue({
        result: "ok",
      });

      await menuService.updateMenuItem(1, {
        name: "Tomato Stew",
        price: 1000,
        category: "Stew",
        description: "Updated stew",
        available: true,
        imageUrl: "https://cloudinary.com/new-image.jpg",
        imagePublicId: "restaurant/new-image",
      });

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "restaurant/old-image"
      );

      expect(deleteCachePattern).toHaveBeenCalledWith("menu:*");
    });

    it("does not delete an image when no new image is provided", async () => {
      const existingItem = {
        id: 1,
        name: "Tomato Stew",
        category: "Stew",
        price: 1000,
        imagePublicId: "restaurant/current-image",
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);
      prismaMock.menuItem.update.mockResolvedValue(existingItem);

      await menuService.updateMenuItem(1, {
        name: "Updated Tomato Stew",
        price: 1200,
        category: "Stew",
        description: "Updated description",
        available: true,
      });

      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
      expect(deleteCachePattern).toHaveBeenCalledWith("menu:*");
    });

    it("does not fail the update if Cloudinary image deletion fails", async () => {
      const existingItem = {
        id: 1,
        name: "Tomato Stew",
        category: "Stew",
        price: 1000,
        imagePublicId: "restaurant/old-image",
      };

      const updatedItem = {
        ...existingItem,
        imagePublicId: "restaurant/new-image",
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);
      prismaMock.menuItem.update.mockResolvedValue(updatedItem);

      cloudinary.uploader.destroy.mockRejectedValue(
        new Error("Cloudinary error")
      );

      const result = await menuService.updateMenuItem(1, {
        name: "Tomato Stew",
        price: 1000,
        category: "Stew",
        description: "Updated",
        available: true,
        imageUrl: "https://cloudinary.com/new.jpg",
        imagePublicId: "restaurant/new-image",
      });

      expect(result).toEqual(updatedItem);
      expect(deleteCachePattern).toHaveBeenCalledWith("menu:*");
    });

    it("handles Prisma P2025 error during update", async () => {
      const existingItem = {
        id: 1,
        name: "Tomato Stew",
        imagePublicId: null,
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);

      const prismaError = new Error("Record not found");
      prismaError.code = "P2025";

      prismaMock.menuItem.update.mockRejectedValue(prismaError);

      await expect(
        menuService.updateMenuItem(1, {
          name: "Updated Stew",
        })
      ).rejects.toThrow("Menu item not found");

      expect(deleteCachePattern).not.toHaveBeenCalled();
    });

    it("propagates non-P2025 update errors", async () => {
      const existingItem = {
        id: 1,
        name: "Tomato Stew",
        imagePublicId: null,
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);

      prismaMock.menuItem.update.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        menuService.updateMenuItem(1, {
          name: "Updated Stew",
        })
      ).rejects.toThrow("Database error");

      expect(deleteCachePattern).not.toHaveBeenCalled();
    });
  });

  // =========================================================
  // getAllMenuItems
  // =========================================================

  describe("getAllMenuItems", () => {
    it("returns all menu items", async () => {
      const menuItems = [
        {
          id: 1,
          name: "Tomato Stew",
          category: "Stew",
          price: 1000,
          available: true,
        },
        {
          id: 2,
          name: "Chicken Burger",
          category: "Burger",
          price: 2500,
          available: true,
        },
      ];

      getCache.mockResolvedValue(null);
      prismaMock.menuItem.findMany.mockResolvedValue(menuItems);

      const result = await menuService.getAllMenuItems();

      expect(getCache).toHaveBeenCalledWith("menu:list:all:all");

      expect(prismaMock.menuItem.findMany).toHaveBeenCalledWith({
        where: {},
      });

      expect(setCache).toHaveBeenCalledWith(
        "menu:list:all:all",
        menuItems,
        300
      );

      expect(result).toEqual(menuItems);
    });

    it("returns cached menu items without querying the database", async () => {
      const cachedItems = [
        {
          id: 1,
          name: "Cached Tomato Stew",
          category: "Stew",
          price: 1000,
          available: true,
        },
      ];

      getCache.mockResolvedValue(cachedItems);

      const result = await menuService.getAllMenuItems();

      expect(getCache).toHaveBeenCalledWith("menu:list:all:all");
      expect(prismaMock.menuItem.findMany).not.toHaveBeenCalled();
      expect(setCache).not.toHaveBeenCalled();

      expect(result).toEqual(cachedItems);
    });

    it("uses the correct cache key for category filtering", async () => {
      prismaMock.menuItem.findMany.mockResolvedValue([]);

      await menuService.getAllMenuItems({
        category: "Stew",
      });

      expect(getCache).toHaveBeenCalledWith(
        "menu:list:Stew:all"
      );

      expect(setCache).toHaveBeenCalledWith(
        "menu:list:Stew:all",
        [],
        300
      );
    });

    it("uses the correct cache key for availability filtering", async () => {
      prismaMock.menuItem.findMany.mockResolvedValue([]);

      await menuService.getAllMenuItems({
        available: "true",
      });

      expect(getCache).toHaveBeenCalledWith(
        "menu:list:all:true"
      );

      expect(setCache).toHaveBeenCalledWith(
        "menu:list:all:true",
        [],
        300
      );
    });

    it("filters menu items by category", async () => {
      const menuItems = [
        {
          id: 1,
          name: "Tomato Stew",
          category: "Stew",
          price: 1000,
          available: true,
        },
      ];

      prismaMock.menuItem.findMany.mockResolvedValue(menuItems);

      const result = await menuService.getAllMenuItems({
        category: "Stew",
      });

      expect(prismaMock.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          category: "Stew",
        },
      });

      expect(result).toEqual(menuItems);
    });

    it("filters menu items by availability", async () => {
      prismaMock.menuItem.findMany.mockResolvedValue([]);

      await menuService.getAllMenuItems({
        available: "true",
      });

      expect(prismaMock.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          available: true,
        },
      });
    });

    it("filters unavailable menu items", async () => {
      prismaMock.menuItem.findMany.mockResolvedValue([]);

      await menuService.getAllMenuItems({
        available: "false",
      });

      expect(prismaMock.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          available: false,
        },
      });
    });

    it("filters by both category and availability", async () => {
      prismaMock.menuItem.findMany.mockResolvedValue([]);

      await menuService.getAllMenuItems({
        category: "Burger",
        available: "true",
      });

      expect(prismaMock.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          category: "Burger",
          available: true,
        },
      });
    });

    it("returns an empty array when no menu items exist", async () => {
      prismaMock.menuItem.findMany.mockResolvedValue([]);

      const result = await menuService.getAllMenuItems();

      expect(result).toEqual([]);
    });

    it("does not query the database when cached data is available", async () => {
      const cachedItems = [
        {
          id: 1,
          name: "Chicken Burger",
          category: "Burger",
          price: 2500,
          available: true,
        },
      ];

      getCache.mockResolvedValue(cachedItems);

      const result = await menuService.getAllMenuItems({
        category: "Burger",
        available: "true",
      });

      expect(getCache).toHaveBeenCalledWith(
        "menu:list:Burger:true"
      );

      expect(prismaMock.menuItem.findMany).not.toHaveBeenCalled();

      expect(setCache).not.toHaveBeenCalled();

      expect(result).toEqual(cachedItems);
    });

    it("propagates database errors", async () => {
      prismaMock.menuItem.findMany.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        menuService.getAllMenuItems()
      ).rejects.toThrow("Database error");

      expect(setCache).not.toHaveBeenCalled();
    });

    it("propagates cache errors before querying the database", async () => {
      getCache.mockRejectedValue(new Error("Cache error"));

      await expect(
        menuService.getAllMenuItems()
      ).rejects.toThrow("Cache error");

      expect(prismaMock.menuItem.findMany).not.toHaveBeenCalled();
    });

    it("propagates cache set errors after fetching menu items", async () => {
      const menuItems = [
        {
          id: 1,
          name: "Tomato Stew",
          category: "Stew",
          price: 1000,
          available: true,
        },
      ];

      prismaMock.menuItem.findMany.mockResolvedValue(menuItems);
      setCache.mockRejectedValue(new Error("Cache set failed"));

      await expect(
        menuService.getAllMenuItems()
      ).rejects.toThrow("Cache set failed");

      expect(prismaMock.menuItem.findMany).toHaveBeenCalledWith({
        where: {},
      });
    });
  });

  // =========================================================
  // getMenuItemById
  // =========================================================

  describe("getMenuItemById", () => {
    it("returns a menu item by ID", async () => {
      const menuItem = {
        id: 1,
        name: "Tomato Stew",
        category: "Stew",
        price: 1000,
        available: true,
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(menuItem);

      const result = await menuService.getMenuItemById(1);

      expect(prismaMock.menuItem.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(result).toEqual(menuItem);
    });

    it("parses the menu item ID into an integer", async () => {
      const menuItem = {
        id: 1,
        name: "Tomato Stew",
        category: "Stew",
        price: 1000,
        available: true,
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(menuItem);

      await menuService.getMenuItemById("1");

      expect(prismaMock.menuItem.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
    });

    it("throws when menu item does not exist", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue(null);

      await expect(
        menuService.getMenuItemById(99)
      ).rejects.toThrow("Menu item not found");
    });

    it("propagates database errors", async () => {
      prismaMock.menuItem.findUnique.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        menuService.getMenuItemById(1)
      ).rejects.toThrow("Database error");
    });
  });

  // =========================================================
  // deleteMenuItem
  // =========================================================

  describe("deleteMenuItem", () => {
    it("deletes a menu item successfully", async () => {
      const existingItem = {
        id: 1,
        name: "Tomato Stew",
        imagePublicId: null,
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);
      prismaMock.menuItem.delete.mockResolvedValue(existingItem);

      const result = await menuService.deleteMenuItem(1);

      expect(prismaMock.menuItem.delete).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(deleteCachePattern).toHaveBeenCalledWith("menu:*");
      expect(result).toEqual(existingItem);
    });

    it("deletes the Cloudinary image before deleting the menu item", async () => {
      const existingItem = {
        id: 1,
        name: "Tomato Stew",
        imagePublicId: "restaurant/tomato-stew",
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);
      prismaMock.menuItem.delete.mockResolvedValue(existingItem);

      cloudinary.uploader.destroy.mockResolvedValue({
        result: "ok",
      });

      await menuService.deleteMenuItem(1);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "restaurant/tomato-stew"
      );

      expect(prismaMock.menuItem.delete).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(deleteCachePattern).toHaveBeenCalledWith("menu:*");
    });

    it("does not call Cloudinary when the menu item has no image", async () => {
      const existingItem = {
        id: 1,
        name: "Tomato Stew",
        imagePublicId: null,
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);
      prismaMock.menuItem.delete.mockResolvedValue(existingItem);

      await menuService.deleteMenuItem(1);

      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
      expect(deleteCachePattern).toHaveBeenCalledWith("menu:*");
    });

    it("does not fail deletion if Cloudinary image deletion fails", async () => {
      const existingItem = {
        id: 1,
        name: "Tomato Stew",
        imagePublicId: "restaurant/tomato-stew",
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);
      prismaMock.menuItem.delete.mockResolvedValue(existingItem);

      cloudinary.uploader.destroy.mockRejectedValue(
        new Error("Cloudinary error")
      );

      const result = await menuService.deleteMenuItem(1);

      expect(result).toEqual(existingItem);
      expect(prismaMock.menuItem.delete).toHaveBeenCalled();
      expect(deleteCachePattern).toHaveBeenCalledWith("menu:*");
    });

    it("throws when menu item does not exist", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue(null);

      await expect(
        menuService.deleteMenuItem(99)
      ).rejects.toThrow("Menu item not found");

      expect(prismaMock.menuItem.delete).not.toHaveBeenCalled();
      expect(deleteCachePattern).not.toHaveBeenCalled();
    });

    it("handles Prisma P2025 error during deletion", async () => {
      const existingItem = {
        id: 1,
        name: "Tomato Stew",
        imagePublicId: null,
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);

      const prismaError = new Error("Record not found");
      prismaError.code = "P2025";

      prismaMock.menuItem.delete.mockRejectedValue(prismaError);

      await expect(
        menuService.deleteMenuItem(1)
      ).rejects.toThrow("Menu item not found");

      expect(deleteCachePattern).not.toHaveBeenCalled();
    });

    it("propagates non-P2025 deletion errors", async () => {
      const existingItem = {
        id: 1,
        name: "Tomato Stew",
        imagePublicId: null,
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);

      prismaMock.menuItem.delete.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        menuService.deleteMenuItem(1)
      ).rejects.toThrow("Database error");

      expect(deleteCachePattern).not.toHaveBeenCalled();
    });

    it("parses the menu item ID into an integer", async () => {
      const existingItem = {
        id: 1,
        name: "Tomato Stew",
        imagePublicId: null,
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);
      prismaMock.menuItem.delete.mockResolvedValue(existingItem);

      await menuService.deleteMenuItem("1");

      expect(prismaMock.menuItem.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(prismaMock.menuItem.delete).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
    });
  });
});