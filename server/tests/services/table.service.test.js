jest.mock("../../prisma/client", () =>
  require("../../prisma/client.mock")
);

const prismaMock = require("../../prisma/client.mock");
const tableService = require("../../services/table.service");

describe("table.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================
  // createTable
  // =========================================================

  describe("createTable", () => {
    it("rejects when table number is missing", async () => {
      await expect(
        tableService.createTable({
          tableNumber: null,
          capacity: 4,
        })
      ).rejects.toThrow(
        "Table number and table capacity are required"
      );

      expect(prismaMock.table.create).not.toHaveBeenCalled();
    });

    it("rejects when capacity is missing", async () => {
      await expect(
        tableService.createTable({
          tableNumber: 1,
          capacity: null,
        })
      ).rejects.toThrow(
        "Table number and table capacity are required"
      );

      expect(prismaMock.table.create).not.toHaveBeenCalled();
    });

    it("rejects when both table number and capacity are missing", async () => {
      await expect(
        tableService.createTable({
          tableNumber: null,
          capacity: null,
        })
      ).rejects.toThrow(
        "Table number and table capacity are required"
      );
    });

    it("creates a table successfully", async () => {
      const createdTable = {
        id: 1,
        tableNumber: 1,
        capacity: 4,
      };

      prismaMock.table.create.mockResolvedValue(createdTable);

      const result = await tableService.createTable({
        tableNumber: 1,
        capacity: 4,
      });

      expect(result).toEqual(createdTable);

      expect(prismaMock.table.create).toHaveBeenCalledWith({
        data: {
          tableNumber: 1,
          capacity: 4,
        },
      });
    });

    it("creates a table with the correct data", async () => {
      prismaMock.table.create.mockResolvedValue({
        id: 5,
        tableNumber: 10,
        capacity: 8,
      });

      await tableService.createTable({
        tableNumber: 10,
        capacity: 8,
      });

      expect(prismaMock.table.create).toHaveBeenCalledTimes(1);

      expect(prismaMock.table.create).toHaveBeenCalledWith({
        data: {
          tableNumber: 10,
          capacity: 8,
        },
      });
    });

    it("handles duplicate table numbers with P2002", async () => {
      const prismaError = new Error(
        "Unique constraint failed"
      );
      prismaError.code = "P2002";

      prismaMock.table.create.mockRejectedValue(
        prismaError
      );

      await expect(
        tableService.createTable({
          tableNumber: 1,
          capacity: 4,
        })
      ).rejects.toThrow("This table already exists");
    });

    it("preserves unexpected Prisma errors", async () => {
      const prismaError = new Error(
        "Database connection failed"
      );

      prismaMock.table.create.mockRejectedValue(
        prismaError
      );

      await expect(
        tableService.createTable({
          tableNumber: 1,
          capacity: 4,
        })
      ).rejects.toThrow("Database connection failed");
    });
  });

  // =========================================================
  // updateTableCapacity
  // =========================================================

  describe("updateTableCapacity", () => {
    it("rejects when capacity is missing", async () => {
      await expect(
        tableService.updateTableCapacity(1, null)
      ).rejects.toThrow("Table capacity is required");

      expect(prismaMock.table.update).not.toHaveBeenCalled();
    });

    it("successfully updates table capacity", async () => {
      const updatedTable = {
        id: 1,
        tableNumber: 1,
        capacity: 6,
      };

      prismaMock.table.update.mockResolvedValue(
        updatedTable
      );

      const result =
        await tableService.updateTableCapacity(1, 6);

      expect(result).toEqual(updatedTable);

      expect(prismaMock.table.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          capacity: 6,
        },
      });
    });

    it("parses the table ID correctly", async () => {
      prismaMock.table.update.mockResolvedValue({
        id: 7,
        tableNumber: 7,
        capacity: 8,
      });

      await tableService.updateTableCapacity("7", 8);

      expect(prismaMock.table.update).toHaveBeenCalledWith({
        where: {
          id: 7,
        },
        data: {
          capacity: 8,
        },
      });
    });

    it("throws Table not found when Prisma returns P2025", async () => {
      const prismaError = new Error("Record not found");

      prismaError.code = "P2025";

      prismaMock.table.update.mockRejectedValue(
        prismaError
      );

      await expect(
        tableService.updateTableCapacity(99, 6)
      ).rejects.toThrow("Table not found");
    });

    it("preserves unexpected Prisma errors", async () => {
      const prismaError = new Error(
        "Database connection failed"
      );

      prismaMock.table.update.mockRejectedValue(
        prismaError
      );

      await expect(
        tableService.updateTableCapacity(1, 6)
      ).rejects.toThrow("Database connection failed");
    });
  });

  // =========================================================
  // deleteTable
  // =========================================================

  describe("deleteTable", () => {
    it("deletes a table successfully", async () => {
      const deletedTable = {
        id: 1,
        tableNumber: 1,
        capacity: 4,
      };

      prismaMock.table.delete.mockResolvedValue(
        deletedTable
      );

      const result = await tableService.deleteTable(1);

      expect(result).toEqual(deletedTable);

      expect(prismaMock.table.delete).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
    });

    it("parses the table ID correctly", async () => {
      prismaMock.table.delete.mockResolvedValue({
        id: 10,
        tableNumber: 10,
        capacity: 6,
      });

      await tableService.deleteTable("10");

      expect(prismaMock.table.delete).toHaveBeenCalledWith({
        where: {
          id: 10,
        },
      });
    });

    it("throws Table not found when Prisma returns P2025", async () => {
      const prismaError = new Error("Record not found");

      prismaError.code = "P2025";

      prismaMock.table.delete.mockRejectedValue(
        prismaError
      );

      await expect(
        tableService.deleteTable(99)
      ).rejects.toThrow("Table not found");
    });

    it("preserves unexpected Prisma errors", async () => {
      const prismaError = new Error(
        "Database connection failed"
      );

      prismaMock.table.delete.mockRejectedValue(
        prismaError
      );

      await expect(
        tableService.deleteTable(1)
      ).rejects.toThrow("Database connection failed");
    });
  });
});