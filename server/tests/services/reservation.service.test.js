jest.mock("../../prisma/client", () =>
  require("../../prisma/client.mock")
);

const prismaMock = require("../../prisma/client.mock");
const reservationService = require("../../services/reservations.service");

describe("reservation.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================
  // createReservation
  // =========================================================

  describe("createReservation", () => {
    const validReservation = {
      customerId: 1,
      tableId: 2,
      date: "2026-09-01",
      timeSlot: "18:00",
      guestCount: 4,
    };

    it("rejects when required fields are missing", async () => {
      await expect(
        reservationService.createReservation(
          1,
          2,
          null,
          "18:00",
          4
        )
      ).rejects.toThrow("All fields are required");

      await expect(
        reservationService.createReservation(
          1,
          2,
          "2026-09-01",
          null,
          4
        )
      ).rejects.toThrow("All fields are required");

      await expect(
        reservationService.createReservation(
          1,
          2,
          "2026-09-01",
          "18:00",
          null
        )
      ).rejects.toThrow("All fields are required");
    });

    it("throws when the table does not exist", async () => {
      prismaMock.table.findUnique.mockResolvedValue(null);

      await expect(
        reservationService.createReservation(
          validReservation.customerId,
          validReservation.tableId,
          validReservation.date,
          validReservation.timeSlot,
          validReservation.guestCount
        )
      ).rejects.toThrow("Table not found");

      expect(prismaMock.table.findUnique).toHaveBeenCalledWith({
        where: { id: 2 },
      });
    });

    it("rejects when guest count exceeds table capacity", async () => {
      prismaMock.table.findUnique.mockResolvedValue({
        id: 2,
        capacity: 4,
      });

      await expect(
        reservationService.createReservation(
          1,
          2,
          "2026-09-01",
          "18:00",
          5
        )
      ).rejects.toThrow(
        "Guest count exceeds table capacity max (4)"
      );

      expect(prismaMock.reservation.create).not.toHaveBeenCalled();
    });

    it("creates a reservation successfully", async () => {
      const createdReservation = {
        id: 1,
        customerId: 1,
        tableId: 2,
        date: new Date("2026-09-01"),
        timeSlot: "18:00",
        guestCount: 4,
      };

      prismaMock.table.findUnique.mockResolvedValue({
        id: 2,
        capacity: 4,
      });

      prismaMock.reservation.create.mockResolvedValue(
        createdReservation
      );

      const result =
        await reservationService.createReservation(
          1,
          2,
          "2026-09-01",
          "18:00",
          4
        );

      expect(result).toEqual(createdReservation);

      expect(
        prismaMock.reservation.create
      ).toHaveBeenCalledWith({
        data: {
          customerId: 1,
          tableId: 2,
          date: new Date("2026-09-01"),
          timeSlot: "18:00",
          guestCount: 4,
        },
      });
    });

    it("checks the table using the correct table ID", async () => {
      prismaMock.table.findUnique.mockResolvedValue({
        id: 7,
        capacity: 6,
      });

      prismaMock.reservation.create.mockResolvedValue({
        id: 10,
      });

      await reservationService.createReservation(
        3,
        "7",
        "2026-09-01",
        "20:00",
        3
      );

      expect(
        prismaMock.table.findUnique
      ).toHaveBeenCalledWith({
        where: { id: 7 },
      });
    });

    it("throws a conflict error when the table is already booked", async () => {
      prismaMock.table.findUnique.mockResolvedValue({
        id: 2,
        capacity: 4,
      });

      const prismaError = new Error("Unique constraint failed");
      prismaError.code = "P2002";

      prismaMock.reservation.create.mockRejectedValue(
        prismaError
      );

      await expect(
        reservationService.createReservation(
          1,
          2,
          "2026-09-01",
          "18:00",
          4
        )
      ).rejects.toThrow(
        "This table is already booked for that time and date"
      );
    });

    it("preserves unexpected Prisma errors", async () => {
      prismaMock.table.findUnique.mockResolvedValue({
        id: 2,
        capacity: 4,
      });

      const prismaError = new Error("Database connection failed");

      prismaMock.reservation.create.mockRejectedValue(
        prismaError
      );

      await expect(
        reservationService.createReservation(
          1,
          2,
          "2026-09-01",
          "18:00",
          4
        )
      ).rejects.toThrow("Database connection failed");
    });
  });

  // =========================================================
  // getAvailableTables
  // =========================================================

  describe("getAvailableTables", () => {
    it("rejects when date is missing", async () => {
      await expect(
        reservationService.getAvailableTables({
          date: null,
          timeSlot: "18:00",
        })
      ).rejects.toThrow("Date and time slot are required");

      expect(
        prismaMock.table.findMany
      ).not.toHaveBeenCalled();
    });

    it("rejects when time slot is missing", async () => {
      await expect(
        reservationService.getAvailableTables({
          date: "2026-09-01",
          timeSlot: null,
        })
      ).rejects.toThrow("Date and time slot are required");

      expect(
        prismaMock.table.findMany
      ).not.toHaveBeenCalled();
    });

    it("returns available tables", async () => {
      const tables = [
        { id: 1, capacity: 2 },
        { id: 2, capacity: 4 },
        { id: 3, capacity: 6 },
      ];

      prismaMock.table.findMany.mockResolvedValue(tables);

      const result =
        await reservationService.getAvailableTables({
          date: "2026-09-01",
          timeSlot: "18:00",
        });

      expect(result).toEqual(tables);

      expect(
        prismaMock.table.findMany
      ).toHaveBeenCalledWith({
        where: {
          reservations: {
            none: {
              date: new Date("2026-09-01"),
              timeSlot: "18:00",
            },
          },
        },
      });
    });

    it("returns an empty array when no tables are available", async () => {
      prismaMock.table.findMany.mockResolvedValue([]);

      const result =
        await reservationService.getAvailableTables({
          date: "2026-09-01",
          timeSlot: "18:00",
        });

      expect(result).toEqual([]);
    });
  });

  // =========================================================
  // updateReservation
  // =========================================================

  describe("updateReservation", () => {
    const existingReservation = {
      id: 1,
      customerId: 10,
      tableId: 2,
      date: new Date("2026-09-01"),
      timeSlot: "18:00",
      guestCount: 2,
    };

    const table = {
      id: 2,
      capacity: 4,
    };

    const owner = {
      userId: 10,
      role: "CUSTOMER",
    };

    const admin = {
      userId: 99,
      role: "ADMIN",
    };

    it("throws when the reservation does not exist", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(null);

      await expect(
        reservationService.updateReservation(
          1,
          { guestCount: 3 },
          owner
        )
      ).rejects.toThrow("Reservation not found");

      expect(
        prismaMock.table.findUnique
      ).not.toHaveBeenCalled();
    });

    it("rejects when guest count exceeds table capacity", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        existingReservation
      );

      prismaMock.table.findUnique.mockResolvedValue(table);

      await expect(
        reservationService.updateReservation(
          1,
          { guestCount: 5 },
          owner
        )
      ).rejects.toThrow(
        "Guest count exceeds table capacity max (4)"
      );

      expect(
        prismaMock.reservation.update
      ).not.toHaveBeenCalled();
    });

    it("rejects a non-owner non-admin", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        existingReservation
      );

      prismaMock.table.findUnique.mockResolvedValue(table);

      const otherCustomer = {
        userId: 999,
        role: "CUSTOMER",
      };

      await expect(
        reservationService.updateReservation(
          1,
          { guestCount: 3 },
          otherCustomer
        )
      ).rejects.toThrow(
        "You do not have permission to modify thus reservation"
      );

      expect(
        prismaMock.reservation.update
      ).not.toHaveBeenCalled();
    });

    it("allows the reservation owner to update the reservation", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        existingReservation
      );

      prismaMock.table.findUnique.mockResolvedValue(table);

      const updatedReservation = {
        ...existingReservation,
        guestCount: 3,
      };

      prismaMock.reservation.update.mockResolvedValue(
        updatedReservation
      );

      const result =
        await reservationService.updateReservation(
          1,
          { guestCount: 3 },
          owner
        );

      expect(result).toEqual(updatedReservation);

      expect(
        prismaMock.reservation.update
      ).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          guestCount: 3,
        },
      });
    });

    it("allows an admin to update any reservation", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        existingReservation
      );

      prismaMock.table.findUnique.mockResolvedValue(table);

      prismaMock.reservation.update.mockResolvedValue({
        ...existingReservation,
        timeSlot: "20:00",
      });

      const result =
        await reservationService.updateReservation(
          1,
          { timeSlot: "20:00" },
          admin
        );

      expect(result.timeSlot).toBe("20:00");

      expect(
        prismaMock.reservation.update
      ).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          timeSlot: "20:00",
        },
      });
    });

    it("updates the date when a new date is provided", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        existingReservation
      );

      prismaMock.table.findUnique.mockResolvedValue(table);

      prismaMock.reservation.update.mockResolvedValue({
        ...existingReservation,
        date: new Date("2026-09-02"),
      });

      await reservationService.updateReservation(
        1,
        { date: "2026-09-02" },
        owner
      );

      expect(
        prismaMock.reservation.update
      ).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          date: new Date("2026-09-02"),
        },
      });
    });

    it("updates multiple reservation fields at once", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        existingReservation
      );

      prismaMock.table.findUnique.mockResolvedValue(table);

      prismaMock.reservation.update.mockResolvedValue({
        ...existingReservation,
        date: new Date("2026-09-02"),
        timeSlot: "20:00",
        guestCount: 3,
      });

      await reservationService.updateReservation(
        1,
        {
          date: "2026-09-02",
          timeSlot: "20:00",
          guestCount: 3,
        },
        owner
      );

      expect(
        prismaMock.reservation.update
      ).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          date: new Date("2026-09-02"),
          timeSlot: "20:00",
          guestCount: 3,
        },
      });
    });

    it("cancels a reservation when action is cancel", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        existingReservation
      );

      prismaMock.table.findUnique.mockResolvedValue(table);

      prismaMock.reservation.delete.mockResolvedValue(
        existingReservation
      );

      const result =
        await reservationService.updateReservation(
          1,
          { action: "cancel" },
          owner
        );

      expect(result).toEqual({
        message: "Reservation cancelled",
      });

      expect(
        prismaMock.reservation.delete
      ).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(
        prismaMock.reservation.update
      ).not.toHaveBeenCalled();
    });

    it("allows an admin to cancel a reservation", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        existingReservation
      );

      prismaMock.table.findUnique.mockResolvedValue(table);

      prismaMock.reservation.delete.mockResolvedValue(
        existingReservation
      );

      const result =
        await reservationService.updateReservation(
          1,
          { action: "cancel" },
          admin
        );

      expect(result).toEqual({
        message: "Reservation cancelled",
      });

      expect(
        prismaMock.reservation.delete
      ).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("throws a conflict error when updating to an already booked slot", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        existingReservation
      );

      prismaMock.table.findUnique.mockResolvedValue(table);

      const prismaError = new Error("Unique constraint failed");
      prismaError.code = "P2002";

      prismaMock.reservation.update.mockRejectedValue(
        prismaError
      );

      await expect(
        reservationService.updateReservation(
          1,
          { date: "2026-09-02", timeSlot: "18:00" },
          owner
        )
      ).rejects.toThrow(
        "This table is already booked for that time and date"
      );
    });

    it("does not update fields that were not provided", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        existingReservation
      );

      prismaMock.table.findUnique.mockResolvedValue(table);

      prismaMock.reservation.update.mockResolvedValue(
        existingReservation
      );

      await reservationService.updateReservation(
        1,
        {},
        owner
      );

      expect(
        prismaMock.reservation.update
      ).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {},
      });
    });

    it("parses the reservation ID correctly", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        existingReservation
      );

      prismaMock.table.findUnique.mockResolvedValue(table);

      prismaMock.reservation.update.mockResolvedValue(
        existingReservation
      );

      await reservationService.updateReservation(
        "1",
        { guestCount: 3 },
        owner
      );

      expect(
        prismaMock.reservation.findUnique
      ).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});