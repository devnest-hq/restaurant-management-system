jest.mock("../../prisma/client", () =>
  require("../../prisma/client.mock")
);

const prismaMock = require("../../prisma/client.mock");
const notificationService = require("../../services/notification.service");

describe("notification.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset socket instance between tests
    notificationService.setSocketIO(null);
  });

  // =========================================================
  // setSocketIO
  // =========================================================

  describe("setSocketIO", () => {
    it("sets the Socket.IO instance successfully", async () => {
      const io = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      notificationService.setSocketIO(io);

      prismaMock.notification.create.mockResolvedValue({
        id: 1,
        userId: 10,
        type: "ORDER_UPDATE",
        message: "Your order is ready",
      });

      await notificationService.createNotification({
        userId: 10,
        type: "ORDER_UPDATE",
        message: "Your order is ready",
      });

      expect(io.to).toHaveBeenCalledWith("user-10");
      expect(io.emit).toHaveBeenCalledWith(
        "notification",
        expect.objectContaining({
          id: 1,
          userId: 10,
        })
      );
    });
  });

  // =========================================================
  // createNotification
  // =========================================================

  describe("createNotification", () => {
    it("throws when userId is missing", async () => {
      await expect(
        notificationService.createNotification({
          type: "ORDER_UPDATE",
          message: "Your order is ready",
        })
      ).rejects.toThrow(
        "Provide the notification type, message, and the user it belongs to"
      );

      expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });

    it("throws when notification type is missing", async () => {
      await expect(
        notificationService.createNotification({
          userId: 10,
          message: "Your order is ready",
        })
      ).rejects.toThrow(
        "Provide the notification type, message, and the user it belongs to"
      );

      expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });

    it("throws when message is missing", async () => {
      await expect(
        notificationService.createNotification({
          userId: 10,
          type: "ORDER_UPDATE",
        })
      ).rejects.toThrow(
        "Provide the notification type, message, and the user it belongs to"
      );

      expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });

    it("throws when all required fields are missing", async () => {
      await expect(
        notificationService.createNotification({})
      ).rejects.toThrow(
        "Provide the notification type, message, and the user it belongs to"
      );

      expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });

    it("creates a notification successfully", async () => {
      const notification = {
        id: 1,
        userId: 10,
        type: "ORDER_UPDATE",
        message: "Your order is ready",
        isRead: false,
      };

      prismaMock.notification.create.mockResolvedValue(notification);

      const result = await notificationService.createNotification({
        userId: 10,
        type: "ORDER_UPDATE",
        message: "Your order is ready",
      });

      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 10,
          type: "ORDER_UPDATE",
          message: "Your order is ready",
        },
      });

      expect(result).toEqual(notification);
    });

    it("parses userId into an integer", async () => {
      const notification = {
        id: 2,
        userId: 25,
        type: "SYSTEM",
        message: "Welcome",
      };

      prismaMock.notification.create.mockResolvedValue(notification);

      await notificationService.createNotification({
        userId: "25",
        type: "SYSTEM",
        message: "Welcome",
      });

      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 25,
          type: "SYSTEM",
          message: "Welcome",
        },
      });
    });

    it("does not emit through Socket.IO when it has not been configured", async () => {
      const notification = {
        id: 3,
        userId: 10,
        type: "SYSTEM",
        message: "Test notification",
      };

      prismaMock.notification.create.mockResolvedValue(notification);

      await expect(
        notificationService.createNotification({
          userId: 10,
          type: "SYSTEM",
          message: "Test notification",
        })
      ).resolves.toEqual(notification);
    });

    it("emits the notification to the correct user through Socket.IO", async () => {
      const io = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      const notification = {
        id: 4,
        userId: 15,
        type: "ORDER_UPDATE",
        message: "Your order has been served",
      };

      notificationService.setSocketIO(io);

      prismaMock.notification.create.mockResolvedValue(notification);

      const result = await notificationService.createNotification({
        userId: 15,
        type: "ORDER_UPDATE",
        message: "Your order has been served",
      });

      expect(io.to).toHaveBeenCalledWith("user-15");
      expect(io.emit).toHaveBeenCalledWith(
        "notification",
        notification
      );

      expect(result).toEqual(notification);
    });

    it("propagates Prisma errors", async () => {
      prismaMock.notification.create.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        notificationService.createNotification({
          userId: 10,
          type: "SYSTEM",
          message: "Test",
        })
      ).rejects.toThrow("Database error");
    });
  });

  // =========================================================
  // notifyRoles
  // =========================================================

  describe("notifyRoles", () => {
    it("finds all staff belonging to the specified roles", async () => {
      const staff = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ];

      prismaMock.user.findMany.mockResolvedValue(staff);
      prismaMock.notification.create.mockResolvedValue({
        id: 1,
        userId: 1,
        type: "SYSTEM",
        message: "Test notification",
      });

      await notificationService.notifyRoles(
        ["ADMIN", "STAFF"],
        {
          type: "SYSTEM",
          message: "Test notification",
        }
      );

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: {
          role: {
            in: ["ADMIN", "STAFF"],
          },
        },
        select: {
          id: true,
        },
      });
    });

    it("creates a notification for every matching staff member", async () => {
      const staff = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ];

      prismaMock.user.findMany.mockResolvedValue(staff);

      prismaMock.notification.create.mockImplementation(
        async ({ data }) => ({
          id: data.userId,
          ...data,
        })
      );

      await notificationService.notifyRoles(
        ["ADMIN", "MANAGER"],
        {
          type: "LOW_STOCK",
          message: "Inventory is running low",
        }
      );

      expect(prismaMock.notification.create).toHaveBeenCalledTimes(3);

      expect(prismaMock.notification.create).toHaveBeenNthCalledWith(1, {
        data: {
          userId: 1,
          type: "LOW_STOCK",
          message: "Inventory is running low",
        },
      });

      expect(prismaMock.notification.create).toHaveBeenNthCalledWith(2, {
        data: {
          userId: 2,
          type: "LOW_STOCK",
          message: "Inventory is running low",
        },
      });

      expect(prismaMock.notification.create).toHaveBeenNthCalledWith(3, {
        data: {
          userId: 3,
          type: "LOW_STOCK",
          message: "Inventory is running low",
        },
      });
    });

    it("does not create notifications when no staff match the roles", async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      await notificationService.notifyRoles(
        ["ADMIN"],
        {
          type: "SYSTEM",
          message: "System notification",
        }
      );

      expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });

    it("uses the supplied transaction client to find staff", async () => {
      const tx = {
        user: {
          findMany: jest.fn(),
        },
      };

      tx.user.findMany.mockResolvedValue([
        { id: 10 },
        { id: 20 },
      ]);

      prismaMock.notification.create.mockResolvedValue({
        id: 1,
        userId: 10,
        type: "SYSTEM",
        message: "Transaction test",
      });

      await notificationService.notifyRoles(
        ["STAFF"],
        {
          type: "SYSTEM",
          message: "Transaction test",
        },
        tx
      );

      expect(tx.user.findMany).toHaveBeenCalledWith({
        where: {
          role: {
            in: ["STAFF"],
          },
        },
        select: {
          id: true,
        },
      });

      expect(prismaMock.user.findMany).not.toHaveBeenCalled();
    });

    it("propagates errors from finding staff", async () => {
      prismaMock.user.findMany.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        notificationService.notifyRoles(
          ["ADMIN"],
          {
            type: "SYSTEM",
            message: "Test",
          }
        )
      ).rejects.toThrow("Database error");

      expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });

    it("rejects when creating one of the notifications fails", async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { id: 1 },
        { id: 2 },
      ]);

      prismaMock.notification.create
        .mockResolvedValueOnce({
          id: 1,
          userId: 1,
          type: "SYSTEM",
          message: "Test",
        })
        .mockRejectedValueOnce(new Error("Notification creation failed"));

      await expect(
        notificationService.notifyRoles(
          ["STAFF"],
          {
            type: "SYSTEM",
            message: "Test",
          }
        )
      ).rejects.toThrow("Notification creation failed");
    });
  });

  // =========================================================
  // getNotifications
  // =========================================================

  describe("getNotifications", () => {
    it("throws when userId is missing", async () => {
      await expect(
        notificationService.getNotifications()
      ).rejects.toThrow("Provide user ID");

      expect(prismaMock.notification.findMany).not.toHaveBeenCalled();
    });

    it("throws when userId is null", async () => {
      await expect(
        notificationService.getNotifications(null)
      ).rejects.toThrow("Provide user ID");

      expect(prismaMock.notification.findMany).not.toHaveBeenCalled();
    });

    it("returns notifications for a user", async () => {
      const notifications = [
        {
          id: 2,
          userId: 10,
          type: "ORDER_UPDATE",
          message: "Your order is ready",
          isRead: false,
        },
        {
          id: 1,
          userId: 10,
          type: "SYSTEM",
          message: "Welcome",
          isRead: true,
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(notifications);

      const result = await notificationService.getNotifications(10);

      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: {
          userId: 10,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result).toEqual(notifications);
    });

    it("parses userId into an integer", async () => {
      prismaMock.notification.findMany.mockResolvedValue([]);

      await notificationService.getNotifications("25");

      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: {
          userId: 25,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("returns an empty array when the user has no notifications", async () => {
      prismaMock.notification.findMany.mockResolvedValue([]);

      const result = await notificationService.getNotifications(99);

      expect(result).toEqual([]);
    });

    it("propagates Prisma errors", async () => {
      prismaMock.notification.findMany.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        notificationService.getNotifications(10)
      ).rejects.toThrow("Database error");
    });
  });

  // =========================================================
  // readNotification
  // =========================================================

  describe("readNotification", () => {
    it("throws when the notification does not exist", async () => {
      prismaMock.notification.findUnique.mockResolvedValue(null);

      await expect(
        notificationService.readNotification(999, 10)
      ).rejects.toThrow("Notification not found");

      expect(prismaMock.notification.update).not.toHaveBeenCalled();
    });

    it("denies access when the notification belongs to another user", async () => {
      prismaMock.notification.findUnique.mockResolvedValue({
        id: 1,
        userId: 20,
        type: "SYSTEM",
        message: "Private notification",
        isRead: false,
      });

      await expect(
        notificationService.readNotification(1, 10)
      ).rejects.toThrow("Access denied");

      expect(prismaMock.notification.update).not.toHaveBeenCalled();
    });

    it("marks a user's notification as read", async () => {
      const notification = {
        id: 1,
        userId: 10,
        type: "ORDER_UPDATE",
        message: "Your order is ready",
        isRead: false,
      };

      const updatedNotification = {
        ...notification,
        isRead: true,
      };

      prismaMock.notification.findUnique.mockResolvedValue(notification);
      prismaMock.notification.update.mockResolvedValue(updatedNotification);

      const result = await notificationService.readNotification(1, 10);

      expect(prismaMock.notification.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(prismaMock.notification.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          isRead: true,
        },
      });

      expect(result).toEqual(updatedNotification);
    });

    it("parses notification id into an integer", async () => {
      const notification = {
        id: 5,
        userId: 10,
        type: "SYSTEM",
        message: "Test",
        isRead: false,
      };

      prismaMock.notification.findUnique.mockResolvedValue(notification);
      prismaMock.notification.update.mockResolvedValue({
        ...notification,
        isRead: true,
      });

      await notificationService.readNotification("5", 10);

      expect(prismaMock.notification.findUnique).toHaveBeenCalledWith({
        where: {
          id: 5,
        },
      });

      expect(prismaMock.notification.update).toHaveBeenCalledWith({
        where: {
          id: 5,
        },
        data: {
          isRead: true,
        },
      });
    });

    it("allows the notification owner to mark it as read", async () => {
      const notification = {
        id: 7,
        userId: 25,
        type: "SYSTEM",
        message: "Welcome",
        isRead: false,
      };

      prismaMock.notification.findUnique.mockResolvedValue(notification);
      prismaMock.notification.update.mockResolvedValue({
        ...notification,
        isRead: true,
      });

      const result = await notificationService.readNotification(7, 25);

      expect(result.isRead).toBe(true);
      expect(prismaMock.notification.update).toHaveBeenCalled();
    });

    it("propagates Prisma errors when finding the notification", async () => {
      prismaMock.notification.findUnique.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        notificationService.readNotification(1, 10)
      ).rejects.toThrow("Database error");

      expect(prismaMock.notification.update).not.toHaveBeenCalled();
    });

    it("propagates Prisma errors when updating the notification", async () => {
      prismaMock.notification.findUnique.mockResolvedValue({
        id: 1,
        userId: 10,
        type: "SYSTEM",
        message: "Test",
        isRead: false,
      });

      prismaMock.notification.update.mockRejectedValue(
        new Error("Update failed")
      );

      await expect(
        notificationService.readNotification(1, 10)
      ).rejects.toThrow("Update failed");
    });
  });

  // =========================================================
  // readAllNotifications
  // =========================================================

  describe("readAllNotifications", () => {
    it("marks all notifications belonging to a user as read", async () => {
      const result = {
        count: 4,
      };

      prismaMock.notification.updateMany.mockResolvedValue(result);

      const response =
        await notificationService.readAllNotifications(10);

      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 10,
        },
        data: {
          isRead: true,
        },
      });

      expect(response).toEqual(result);
    });

    it("parses userId into an integer", async () => {
      prismaMock.notification.updateMany.mockResolvedValue({
        count: 2,
      });

      await notificationService.readAllNotifications("25");

      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 25,
        },
        data: {
          isRead: true,
        },
      });
    });

    it("returns count zero when the user has no notifications", async () => {
      prismaMock.notification.updateMany.mockResolvedValue({
        count: 0,
      });

      const result =
        await notificationService.readAllNotifications(99);

      expect(result).toEqual({
        count: 0,
      });
    });

    it("propagates Prisma errors", async () => {
      prismaMock.notification.updateMany.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        notificationService.readAllNotifications(10)
      ).rejects.toThrow("Database error");
    });
  });
});
