jest.mock("../../prisma/client", () =>
  require("../../prisma/client.mock")
);

jest.mock("../../config/cloudinary", () => ({
  uploader: {
    destroy: jest.fn(),
  },
}));

const prismaMock = require("../../prisma/client.mock");
const cloudinary = require("../../config/cloudinary");
const menuService = require("../../services/menu.service");


describe("menu.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  // =========================================================
  // createMenuItem
  // =========================================================

  describe("createMenuItem", () => {
    it("rejects when name is missing", () => {
      expect(() =>
        menuService.createMenuItem({
          category: "Stew",
          price: 1000,
        })
      ).toThrow("All fields are required");

      expect(prismaMock.menuItem.create).not.toHaveBeenCalled();
    });

    it("rejects when category is missing", () => {
      expect(() =>
        menuService.createMenuItem({
          name: "Tomato Stew",
          price: 1000,
        })
      ).toThrow("All fields are required");

      expect(prismaMock.menuItem.create).not.toHaveBeenCalled();
    });

    it("rejects when price is missing", () => {
      expect(() =>
        menuService.createMenuItem({
          name: "Tomato Stew",
          category: "Stew",
        })
      ).toThrow("All fields are required");

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

      expect(result.name).toBe("Chicken Burger");
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

      prismaMock.menuItem.findMany.mockResolvedValue(menuItems);

      const result = await menuService.getAllMenuItems();

      expect(prismaMock.menuItem.findMany).toHaveBeenCalledWith({
        where: {},
      });

      expect(result).toEqual(menuItems);
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

    it("throws when menu item does not exist", async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue(null);

      await expect(
        menuService.getMenuItemById(99)
      ).rejects.toThrow("Menu item not found");
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
    });
  });
});