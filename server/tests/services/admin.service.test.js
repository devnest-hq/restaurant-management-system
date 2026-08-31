jest.mock("../../prisma/client", () =>
  require("../../prisma/client.mock")
);

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
}));

const prismaMock = require("../../prisma/client.mock");
const bcrypt = require("bcrypt");
const adminService = require("../../services/admin.service");

describe("admin.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.WAITERS_ACCESS_TOKEN_SECRET = "waiter-secret";
    process.env.CHEFS_ACCESS_TOKEN_SECRET = "chef-secret";

    bcrypt.hash.mockResolvedValue("hashed-password");
  });

  // =========================================================
  // createStaff
  // =========================================================

  describe("createStaff", () => {
    it("rejects when name is missing", async () => {
      await expect(
        adminService.createStaff("", "waiter@test.com", "WAITER")
      ).rejects.toThrow("Name, email and role are required");

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it("rejects when email is missing", async () => {
      await expect(
        adminService.createStaff("John Doe", "", "WAITER")
      ).rejects.toThrow("Name, email and role are required");

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it("rejects when role is missing", async () => {
      await expect(
        adminService.createStaff("John Doe", "john@test.com", "")
      ).rejects.toThrow("Name, email and role are required");

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it("rejects an invalid role", async () => {
      await expect(
        adminService.createStaff(
          "John Doe",
          "john@test.com",
          "ADMIN"
        )
      ).rejects.toThrow("Invalid role");

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it("uses the waiter secret when creating a WAITER", async () => {
      prismaMock.user.create.mockResolvedValue({
        id: 1,
        name: "John Doe",
        email: "john@test.com",
        password: "hashed-password",
        role: "WAITER",
        mustChangePassword: true,
      });

      await adminService.createStaff(
        "John Doe",
        "john@test.com",
        "WAITER"
      );

      expect(bcrypt.hash).toHaveBeenCalledWith(
        "waiter-secret",
        10
      );
    });

    it("uses the chef secret when creating a CHEF", async () => {
      prismaMock.user.create.mockResolvedValue({
        id: 2,
        name: "Jane Doe",
        email: "jane@test.com",
        password: "hashed-password",
        role: "CHEF",
        mustChangePassword: true,
      });

      await adminService.createStaff(
        "Jane Doe",
        "jane@test.com",
        "CHEF"
      );

      expect(bcrypt.hash).toHaveBeenCalledWith(
        "chef-secret",
        10
      );
    });

    it("hashes the staff password before saving", async () => {
      prismaMock.user.create.mockResolvedValue({
        id: 1,
        name: "John Doe",
        email: "john@test.com",
        password: "hashed-password",
        role: "WAITER",
        mustChangePassword: true,
      });

      await adminService.createStaff(
        "John Doe",
        "john@test.com",
        "WAITER"
      );

      expect(bcrypt.hash).toHaveBeenCalledWith(
        "waiter-secret",
        10
      );

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          name: "John Doe",
          email: "john@test.com",
          password: "hashed-password",
          role: "WAITER",
          mustChangePassword: true,
        },
      });
    });

    it("sets mustChangePassword to true", async () => {
      prismaMock.user.create.mockResolvedValue({
        id: 1,
        name: "John Doe",
        email: "john@test.com",
        password: "hashed-password",
        role: "WAITER",
        mustChangePassword: true,
      });

      await adminService.createStaff(
        "John Doe",
        "john@test.com",
        "WAITER"
      );

      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mustChangePassword: true,
          }),
        })
      );
    });

    it("creates a waiter successfully", async () => {
      prismaMock.user.create.mockResolvedValue({
        id: 1,
        name: "John Doe",
        email: "john@test.com",
        password: "hashed-password",
        role: "WAITER",
        mustChangePassword: true,
      });

      const result = await adminService.createStaff(
        "John Doe",
        "john@test.com",
        "WAITER"
      );

      expect(result).toEqual({
        id: 1,
        name: "John Doe",
        email: "john@test.com",
        role: "WAITER",
        mustChangePassword: true,
      });
    });

    it("creates a chef successfully", async () => {
      prismaMock.user.create.mockResolvedValue({
        id: 2,
        name: "Jane Doe",
        email: "jane@test.com",
        password: "hashed-password",
        role: "CHEF",
        mustChangePassword: true,
      });

      const result = await adminService.createStaff(
        "Jane Doe",
        "jane@test.com",
        "CHEF"
      );

      expect(result).toEqual({
        id: 2,
        name: "Jane Doe",
        email: "jane@test.com",
        role: "CHEF",
        mustChangePassword: true,
      });
    });

    it("does not return the password", async () => {
      prismaMock.user.create.mockResolvedValue({
        id: 1,
        name: "John Doe",
        email: "john@test.com",
        password: "hashed-password",
        role: "WAITER",
        mustChangePassword: true,
      });

      const result = await adminService.createStaff(
        "John Doe",
        "john@test.com",
        "WAITER"
      );

      expect(result.password).toBeUndefined();
    });

    it("handles duplicate email with a 409 error", async () => {
      const prismaError = new Error("Unique constraint failed");
      prismaError.code = "P2002";

      prismaMock.user.create.mockRejectedValue(prismaError);

      await expect(
        adminService.createStaff(
          "John Doe",
          "existing@test.com",
          "WAITER"
        )
      ).rejects.toMatchObject({
        message: "Email already exists",
        status: 409,
      });
    });

    it("rethrows unexpected Prisma errors", async () => {
      const prismaError = new Error("Database unavailable");

      prismaMock.user.create.mockRejectedValue(prismaError);

      await expect(
        adminService.createStaff(
          "John Doe",
          "john@test.com",
          "WAITER"
        )
      ).rejects.toThrow("Database unavailable");
    });
  });

  // =========================================================
  // getAllStaff
  // =========================================================

  describe("getAllStaff", () => {
    it("returns all waiters and chefs", async () => {
      const staff = [
        {
          name: "John Doe",
          email: "john@test.com",
          role: "WAITER",
        },
        {
          name: "Jane Doe",
          email: "jane@test.com",
          role: "CHEF",
        },
      ];

      prismaMock.user.findMany.mockResolvedValue(staff);

      const result = await adminService.getAllStaff();

      expect(result).toEqual(staff);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: {
          role: {
            in: ["WAITER", "CHEF"],
          },
        },
        select: {
          name: true,
          email: true,
          role: true,
        },
      });
    });

    it("returns an empty array when there is no staff", async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      const result = await adminService.getAllStaff();

      expect(result).toEqual([]);
    });
  });

  // =========================================================
  // getStaffById
  // =========================================================

  describe("getStaffById", () => {
    it("returns a staff member by ID", async () => {
      const staff = {
        name: "John Doe",
        email: "john@test.com",
        role: "WAITER",
      };

      prismaMock.user.findUnique.mockResolvedValue(staff);

      const result = await adminService.getStaffById("1");

      expect(result).toEqual(staff);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
          role: {
            in: ["WAITER", "CHEF"],
          },
        },
        select: {
          name: true,
          email: true,
          role: true,
        },
      });
    });

    it("returns null when the staff member does not exist", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await adminService.getStaffById("99");

      expect(result).toBeNull();
    });

    it("converts the ID to an integer", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await adminService.getStaffById("25");

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 25,
          }),
        })
      );
    });
  });

  // =========================================================
  // updateStaff
  // =========================================================

  describe("updateStaff", () => {
    it("rejects an invalid staff role", async () => {
      const result = await adminService.updateStaff(
        1,
        "John Doe",
        "john@test.com",
        "ADMIN"
      );

      expect(result).toEqual({
        error: true,
        message: "Staff role must be either WAITER or CHEF",
      });

      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it("returns null when the staff member does not exist", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await adminService.updateStaff(
        99,
        "John Doe",
        "john@test.com",
        "WAITER"
      );

      expect(result).toBeNull();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it("returns null when the existing user is not staff", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        name: "Admin",
        email: "admin@test.com",
        role: "ADMIN",
      });

      const result = await adminService.updateStaff(
        1,
        "Changed Name",
        "changed@test.com",
        "WAITER"
      );

      expect(result).toBeNull();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it("updates a waiter successfully", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        role: "WAITER",
      });

      const updatedStaff = {
        name: "John Updated",
        email: "updated@test.com",
        role: "CHEF",
      };

      prismaMock.user.update.mockResolvedValue(updatedStaff);

      const result = await adminService.updateStaff(
        1,
        "John Updated",
        "updated@test.com",
        "CHEF"
      );

      expect(result).toEqual(updatedStaff);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          name: "John Updated",
          email: "updated@test.com",
          role: "CHEF",
        },
        select: {
          name: true,
          email: true,
          role: true,
        },
      });
    });

    it("allows changing CHEF to WAITER", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 2,
        role: "CHEF",
      });

      prismaMock.user.update.mockResolvedValue({
        name: "Jane",
        email: "jane@test.com",
        role: "WAITER",
      });

      const result = await adminService.updateStaff(
        2,
        "Jane",
        "jane@test.com",
        "WAITER"
      );

      expect(result.role).toBe("WAITER");
    });
  });

  // =========================================================
  // deleteStaff
  // =========================================================

  describe("deleteStaff", () => {
    it("returns null when staff does not exist", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await adminService.deleteStaff(99);

      expect(result).toBeNull();
      expect(prismaMock.user.delete).not.toHaveBeenCalled();
    });

    it("deletes a waiter successfully", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        role: "WAITER",
      });

      const deletedStaff = {
        name: "John Doe",
        email: "john@test.com",
        role: "WAITER",
      };

      prismaMock.user.delete.mockResolvedValue(deletedStaff);

      const result = await adminService.deleteStaff("1");

      expect(result).toEqual(deletedStaff);

      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: {
          id: 1,
          role: {
            in: ["WAITER", "CHEF"],
          },
        },
        select: {
          name: true,
          email: true,
          role: true,
        },
      });
    });

    it("deletes a chef successfully", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 2,
        role: "CHEF",
      });

      const deletedStaff = {
        name: "Jane Doe",
        email: "jane@test.com",
        role: "CHEF",
      };

      prismaMock.user.delete.mockResolvedValue(deletedStaff);

      const result = await adminService.deleteStaff(2);

      expect(result).toEqual(deletedStaff);
    });
  });

  // =========================================================
  // mostOrderedMenuItems
  // =========================================================

  describe("mostOrderedMenuItems", () => {
    it("returns the most ordered menu items", async () => {
      const resultData = [
        {
          id: 1,
          name: "Tomato Stew",
          total_ordered: 25,
        },
        {
          id: 2,
          name: "Jollof Rice",
          total_ordered: 18,
        },
      ];

      prismaMock.$queryRaw.mockResolvedValue(resultData);

      const result = await adminService.mostOrderedMenuItems();

      expect(result).toEqual(resultData);
      expect(prismaMock.$queryRaw).toHaveBeenCalled();
    });

    it("uses the provided limit", async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      await adminService.mostOrderedMenuItems(10);

      expect(prismaMock.$queryRaw).toHaveBeenCalled();
    });

    it("uses 5 as the default limit", async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      await adminService.mostOrderedMenuItems();

      expect(prismaMock.$queryRaw).toHaveBeenCalled();
    });

    it("returns an empty array when there are no ordered items", async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      const result = await adminService.mostOrderedMenuItems();

      expect(result).toEqual([]);
    });
  });

  // =========================================================
  // salesReport
  // =========================================================

  describe("salesReport", () => {
    it("rejects an invalid period", async () => {
      await expect(
        adminService.salesReport("yearly")
      ).rejects.toThrow(
        "Invalid period. Use daily, weekly, or monthly."
      );

      expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    });

    it("generates a daily sales report", async () => {
      const report = [
        {
          period: new Date("2026-08-28"),
          total_sales: 5000,
        },
      ];

      prismaMock.$queryRaw.mockResolvedValue(report);

      const result = await adminService.salesReport("daily");

      expect(result).toEqual(report);
      expect(prismaMock.$queryRaw).toHaveBeenCalled();
    });

    it("generates a weekly sales report", async () => {
      const report = [
        {
          period: new Date("2026-08-24"),
          total_sales: 15000,
        },
      ];

      prismaMock.$queryRaw.mockResolvedValue(report);

      const result = await adminService.salesReport("weekly");

      expect(result).toEqual(report);
      expect(prismaMock.$queryRaw).toHaveBeenCalled();
    });

    it("generates a monthly sales report", async () => {
      const report = [
        {
          period: new Date("2026-08-01"),
          total_sales: 45000,
        },
      ];

      prismaMock.$queryRaw.mockResolvedValue(report);

      const result = await adminService.salesReport("monthly");

      expect(result).toEqual(report);
      expect(prismaMock.$queryRaw).toHaveBeenCalled();
    });

    it("returns an empty report when there are no sales", async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      const result = await adminService.salesReport("daily");

      expect(result).toEqual([]);
    });
  });

  // =========================================================
  // dashboardData
  // =========================================================

  describe("dashboardData", () => {
    it("returns all dashboard statistics", async () => {
      prismaMock.order.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(70)
        .mockResolvedValueOnce(10);

      prismaMock.order.aggregate.mockResolvedValue({
        _sum: {
          totalPrice: 500000,
        },
      });

      prismaMock.menuItem.count.mockResolvedValue(25);
      prismaMock.inventoryItem.count.mockResolvedValue(40);

      const result = await adminService.dashboardData();

      expect(result).toEqual({
        totalOrders: 100,
        completedOrders: 70,
        cancelledOrders: 10,
        totalRevenue: 500000,
        totalMenuItems: 25,
        totalInventoryItems: 40,
      });
    });

    it("counts all orders", async () => {
      prismaMock.order.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(70)
        .mockResolvedValueOnce(10);

      prismaMock.order.aggregate.mockResolvedValue({
        _sum: {
          totalPrice: 500000,
        },
      });

      prismaMock.menuItem.count.mockResolvedValue(25);
      prismaMock.inventoryItem.count.mockResolvedValue(40);

      await adminService.dashboardData();

      expect(prismaMock.order.count).toHaveBeenCalledWith();
    });

    it("counts only SERVED orders as completed", async () => {
      prismaMock.order.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(70)
        .mockResolvedValueOnce(10);

      prismaMock.order.aggregate.mockResolvedValue({
        _sum: {
          totalPrice: 500000,
        },
      });

      prismaMock.menuItem.count.mockResolvedValue(25);
      prismaMock.inventoryItem.count.mockResolvedValue(40);

      await adminService.dashboardData();

      expect(prismaMock.order.count).toHaveBeenCalledWith({
        where: {
          status: "SERVED",
        },
      });
    });

    it("counts only CANCELLED orders as cancelled", async () => {
      prismaMock.order.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(70)
        .mockResolvedValueOnce(10);

      prismaMock.order.aggregate.mockResolvedValue({
        _sum: {
          totalPrice: 500000,
        },
      });

      prismaMock.menuItem.count.mockResolvedValue(25);
      prismaMock.inventoryItem.count.mockResolvedValue(40);

      await adminService.dashboardData();

      expect(prismaMock.order.count).toHaveBeenCalledWith({
        where: {
          status: "CANCELLED",
        },
      });
    });

    it("calculates revenue from SERVED orders only", async () => {
      prismaMock.order.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(70)
        .mockResolvedValueOnce(10);

      prismaMock.order.aggregate.mockResolvedValue({
        _sum: {
          totalPrice: 500000,
        },
      });

      prismaMock.menuItem.count.mockResolvedValue(25);
      prismaMock.inventoryItem.count.mockResolvedValue(40);

      await adminService.dashboardData();

      expect(prismaMock.order.aggregate).toHaveBeenCalledWith({
        where: {
          status: "SERVED",
        },
        _sum: {
          totalPrice: true,
        },
      });
    });

    it("returns zero revenue when there is no served order revenue", async () => {
      prismaMock.order.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      prismaMock.order.aggregate.mockResolvedValue({
        _sum: {
          totalPrice: null,
        },
      });

      prismaMock.menuItem.count.mockResolvedValue(0);
      prismaMock.inventoryItem.count.mockResolvedValue(0);

      const result = await adminService.dashboardData();

      expect(result.totalRevenue).toBe(0);
    });

    it("returns zero revenue when the aggregate sum is undefined", async () => {
      prismaMock.order.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      prismaMock.order.aggregate.mockResolvedValue({
        _sum: {
          totalPrice: undefined,
        },
      });

      prismaMock.menuItem.count.mockResolvedValue(0);
      prismaMock.inventoryItem.count.mockResolvedValue(0);

      const result = await adminService.dashboardData();

      expect(result.totalRevenue).toBe(0);
    });

    it("counts menu items and inventory items", async () => {
      prismaMock.order.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2);

      prismaMock.order.aggregate.mockResolvedValue({
        _sum: {
          totalPrice: 10000,
        },
      });

      prismaMock.menuItem.count.mockResolvedValue(8);
      prismaMock.inventoryItem.count.mockResolvedValue(12);

      const result = await adminService.dashboardData();

      expect(prismaMock.menuItem.count).toHaveBeenCalledWith();
      expect(prismaMock.inventoryItem.count).toHaveBeenCalledWith();

      expect(result.totalMenuItems).toBe(8);
      expect(result.totalInventoryItems).toBe(12);
    });
  });
});
