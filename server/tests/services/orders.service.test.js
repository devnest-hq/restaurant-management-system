
jest.mock("../../prisma/client", () =>
  require("../../prisma/client.mock")
);

jest.mock("../../services/notification.service", () => ({
  createNotification: jest.fn(),
  notifyRoles: jest.fn(),
}));

jest.mock("../../services/invoice.service");

const prismaMock = require("../../prisma/client.mock");
const invoiceService = require("../../services/invoice.service");
const {
  createNotification,
  notifyRoles,
} = require("../../services/notification.service");
const ordersService = require("../../services/orders.service");

describe("orders.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Make Prisma transactions execute using our mock Prisma client.
    prismaMock.$transaction.mockImplementation(async (callback) => {
      return callback(prismaMock);
    });

    // Invoice service succeeds by default.
    invoiceService.ensureInvoiceExists.mockResolvedValue({
      id: 1,
    });

    // Notifications succeed by default.
    createNotification.mockResolvedValue({});
    notifyRoles.mockResolvedValue(undefined);
  });

  // ============================================================
  // createOrder
  // ============================================================

  describe("createOrder", () => {
    it("rejects an order with no items", async () => {
      await expect(
        ordersService.createOrder({
          customerId: 1,
          items: [],
        })
      ).rejects.toThrow("Order must include at least one item");
    });

    it("rejects an order when items are missing", async () => {
      await expect(
        ordersService.createOrder({
          customerId: 1,
        })
      ).rejects.toThrow("Order must include at least one item");
    });

    it("rejects an invalid menu item ID", async () => {
      await expect(
        ordersService.createOrder({
          customerId: 1,
          items: [
            {
              menuItemId: -1,
              quantity: 1,
            },
          ],
        })
      ).rejects.toThrow("Invalid menu item ID");
    });

    it("rejects a zero menu item ID", async () => {
      await expect(
        ordersService.createOrder({
          customerId: 1,
          items: [
            {
              menuItemId: 0,
              quantity: 1,
            },
          ],
        })
      ).rejects.toThrow("Invalid menu item ID");
    });

    it("rejects a non-integer menu item ID", async () => {
      await expect(
        ordersService.createOrder({
          customerId: 1,
          items: [
            {
              menuItemId: 1.5,
              quantity: 1,
            },
          ],
        })
      ).rejects.toThrow("Invalid menu item ID");
    });

    it("rejects a negative quantity", async () => {
      await expect(
        ordersService.createOrder({
          customerId: 1,
          items: [
            {
              menuItemId: 1,
              quantity: -2,
            },
          ],
        })
      ).rejects.toThrow("Quantity must be a positive whole number");
    });

    it("rejects a zero quantity", async () => {
      await expect(
        ordersService.createOrder({
          customerId: 1,
          items: [
            {
              menuItemId: 1,
              quantity: 0,
            },
          ],
        })
      ).rejects.toThrow("Quantity must be a positive whole number");
    });

    it("rejects a decimal quantity", async () => {
      await expect(
        ordersService.createOrder({
          customerId: 1,
          items: [
            {
              menuItemId: 1,
              quantity: 1.5,
            },
          ],
        })
      ).rejects.toThrow("Quantity must be a positive whole number");
    });

    it("throws when a menu item does not exist", async () => {
      prismaMock.menuItem.findMany.mockResolvedValue([]);

      await expect(
        ordersService.createOrder({
          customerId: 1,
          items: [
            {
              menuItemId: 99,
              quantity: 1,
            },
          ],
        })
      ).rejects.toThrow("Menu item 99 not found");
    });

    it("calculates total price correctly", async () => {
      prismaMock.menuItem.findMany.mockResolvedValue([
        {
          id: 1,
          price: 299,
        },
        {
          id: 2,
          price: 49,
        },
      ]);

      prismaMock.order.create.mockResolvedValue({
        id: 1,
        status: "PENDING",
        totalPrice: 745,
        customerId: 1,
        items: [],
      });

      const order = await ordersService.createOrder({
        customerId: 1,
        items: [
          {
            menuItemId: 1,
            quantity: 2,
          },
          {
            menuItemId: 2,
            quantity: 3,
          },
        ],
      });

      expect(prismaMock.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: 1,
            totalPrice: 745,
            status: "PENDING",
          }),
        })
      );

      expect(order.status).toBe("PENDING");
    });

    it("creates order items with the correct quantities and prices", async () => {
      prismaMock.menuItem.findMany.mockResolvedValue([
        {
          id: 1,
          price: 100,
        },
      ]);

      prismaMock.order.create.mockResolvedValue({
        id: 10,
        status: "PENDING",
        customerId: 1,
        totalPrice: 300,
        items: [],
      });

      await ordersService.createOrder({
        customerId: 1,
        items: [
          {
            menuItemId: 1,
            quantity: 3,
          },
        ],
      });

      expect(prismaMock.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: {
              create: [
                {
                  menuItemId: 1,
                  quantity: 3,
                  unitPrice: 100,
                },
              ],
            },
          }),
        })
      );
    });

    it("creates the order with PENDING status", async () => {
      prismaMock.menuItem.findMany.mockResolvedValue([
        {
          id: 1,
          price: 100,
        },
      ]);

      prismaMock.order.create.mockResolvedValue({
        id: 10,
        status: "PENDING",
        customerId: 1,
        totalPrice: 100,
        items: [],
      });

      await ordersService.createOrder({
        customerId: 1,
        items: [
          {
            menuItemId: 1,
            quantity: 1,
          },
        ],
      });

      expect(prismaMock.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "PENDING",
          }),
        })
      );
    });

    it("generates an invoice after creating the order", async () => {
      prismaMock.menuItem.findMany.mockResolvedValue([
        {
          id: 1,
          price: 100,
        },
      ]);

      const order = {
        id: 5,
        status: "PENDING",
        customerId: 1,
        totalPrice: 100,
        items: [],
      };

      prismaMock.order.create.mockResolvedValue(order);

      await ordersService.createOrder({
        customerId: 1,
        items: [
          {
            menuItemId: 1,
            quantity: 1,
          },
        ],
      });

      expect(
        invoiceService.ensureInvoiceExists
      ).toHaveBeenCalledWith(5);
    });

    it("notifies ADMIN and CHEF when a new order is created", async () => {
      prismaMock.menuItem.findMany.mockResolvedValue([
        {
          id: 1,
          price: 100,
        },
      ]);

      const order = {
        id: 5,
        status: "PENDING",
        customerId: 1,
        totalPrice: 100,
        items: [],
      };

      prismaMock.order.create.mockResolvedValue(order);

      await ordersService.createOrder({
        customerId: 1,
        items: [
          {
            menuItemId: 1,
            quantity: 1,
          },
        ],
      });

      expect(notifyRoles).toHaveBeenCalledWith(
        ["ADMIN", "CHEF"],
        {
          type: "NEW_ORDER",
          message: `A new order 5 has been placed successfully. Total: $100.00.`,
        }
      );
    });

    it("notifies the customer when a new order is created", async () => {
      prismaMock.menuItem.findMany.mockResolvedValue([
        {
          id: 1,
          price: 100,
        },
      ]);

      const order = {
        id: 5,
        status: "PENDING",
        customerId: 25,
        totalPrice: 100,
        items: [],
      };

      prismaMock.order.create.mockResolvedValue(order);

      await ordersService.createOrder({
        customerId: 25,
        items: [
          {
            menuItemId: 1,
            quantity: 1,
          },
        ],
      });

      expect(createNotification).toHaveBeenCalledWith({
        userId: 25,
        type: "ORDER_PLACED",
        message:
          "Your order 5 has been placed successfully. Total: $100.00.",
      });
    });

    it("does not notify when order creation fails", async () => {
      prismaMock.menuItem.findMany.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        ordersService.createOrder({
          customerId: 1,
          items: [
            {
              menuItemId: 1,
              quantity: 1,
            },
          ],
        })
      ).rejects.toThrow("Database error");

      expect(notifyRoles).not.toHaveBeenCalled();
      expect(createNotification).not.toHaveBeenCalled();
    });

    it("propagates an invoice error and does not send notifications", async () => {
      prismaMock.menuItem.findMany.mockResolvedValue([
        {
          id: 1,
          price: 100,
        },
      ]);

      prismaMock.order.create.mockResolvedValue({
        id: 10,
        status: "PENDING",
        customerId: 1,
        totalPrice: 100,
        items: [],
      });

      invoiceService.ensureInvoiceExists.mockRejectedValue(
        new Error("Invoice creation failed")
      );

      await expect(
        ordersService.createOrder({
          customerId: 1,
          items: [
            {
              menuItemId: 1,
              quantity: 1,
            },
          ],
        })
      ).rejects.toThrow("Invoice creation failed");

      expect(notifyRoles).not.toHaveBeenCalled();
      expect(createNotification).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // getOrderById
  // ============================================================

  describe("getOrderById", () => {
    it("returns an order by ID", async () => {
      const mockOrder = {
        id: 1,
        status: "PENDING",
        totalPrice: 1000,
        customerId: 5,
        items: [],
        customer: {
          id: 5,
          name: "John Doe",
          email: "john@example.com",
        },
      };

      prismaMock.order.findUnique.mockResolvedValue(mockOrder);

      const result = await ordersService.getOrderById(1);

      expect(prismaMock.order.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      expect(result).toEqual(mockOrder);
    });

    it("returns null when the order does not exist", async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      const result = await ordersService.getOrderById(999);

      expect(result).toBeNull();
    });
  });

  // ============================================================
  // getAllOrders
  // ============================================================

  describe("getAllOrders", () => {
    it("returns all orders", async () => {
      const mockOrders = [
        {
          id: 1,
          status: "PENDING",
          totalPrice: 1000,
        },
        {
          id: 2,
          status: "READY",
          totalPrice: 2000,
        },
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders);

      const result = await ordersService.getAllOrders();

      expect(prismaMock.order.findMany).toHaveBeenCalledWith({
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result).toEqual(mockOrders);
    });

    it("returns an empty array when there are no orders", async () => {
      prismaMock.order.findMany.mockResolvedValue([]);

      const result = await ordersService.getAllOrders();

      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // getOrdersByCustomer
  // ============================================================

  describe("getOrdersByCustomer", () => {
    it("returns orders belonging to a customer", async () => {
      const mockOrders = [
        {
          id: 1,
          customerId: 5,
          status: "PENDING",
        },
        {
          id: 2,
          customerId: 5,
          status: "SERVED",
        },
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders);

      const result = await ordersService.getOrdersByCustomer(5);

      expect(prismaMock.order.findMany).toHaveBeenCalledWith({
        where: {
          customerId: 5,
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result).toEqual(mockOrders);
    });

    it("returns an empty array when the customer has no orders", async () => {
      prismaMock.order.findMany.mockResolvedValue([]);

      const result = await ordersService.getOrdersByCustomer(999);

      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // updateOrderStatus
  // ============================================================

  describe("updateOrderStatus", () => {
    it("rejects an invalid status", async () => {
      await expect(
        ordersService.updateOrderStatus(1, "INVALID")
      ).rejects.toThrow(/Invalid status/);

      expect(createNotification).not.toHaveBeenCalled();
    });

    it("accepts valid non-terminal statuses", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        status: "PENDING",
      });

      prismaMock.order.update.mockResolvedValue({
        id: 1,
        status: "PREPARING",
        customerId: 5,
        items: [],
      });

      const result = await ordersService.updateOrderStatus(
        1,
        "PREPARING"
      );

      expect(prismaMock.order.update).toHaveBeenCalled();
      expect(result.status).toBe("PREPARING");
    });

    it("throws when the order does not exist", async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      await expect(
        ordersService.updateOrderStatus(999, "PREPARING")
      ).rejects.toThrow("Order not found");

      expect(createNotification).not.toHaveBeenCalled();
    });

    it("blocks changing a SERVED order", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        status: "SERVED",
      });

      await expect(
        ordersService.updateOrderStatus(1, "PREPARING")
      ).rejects.toThrow("Cannot change status of a SERVED order");

      expect(createNotification).not.toHaveBeenCalled();
    });

    it("blocks changing a CANCELLED order", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        status: "CANCELLED",
      });

      await expect(
        ordersService.updateOrderStatus(1, "PREPARING")
      ).rejects.toThrow("Cannot change status of a CANCELLED order");

      expect(createNotification).not.toHaveBeenCalled();
    });

    it("allows PENDING to PREPARING and notifies the customer", async () => {
      const updatedOrder = {
        id: 1,
        customerId: 5,
        status: "PREPARING",
        items: [],
      };

      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        customerId: 5,
        status: "PENDING",
      });

      prismaMock.order.update.mockResolvedValue(updatedOrder);

      const result = await ordersService.updateOrderStatus(
        1,
        "PREPARING"
      );

      expect(prismaMock.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 1,
          },
          data: {
            status: "PREPARING",
          },
        })
      );

      expect(createNotification).toHaveBeenCalledWith({
        userId: 5,
        type: "ORDER STATUS UPDATED",
        message: "Your order 1 is now PREPARING.",
      });

      expect(result.status).toBe("PREPARING");
    });

    it("notifies the customer when a regular status is updated", async () => {
      const updatedOrder = {
        id: 1,
        customerId: 10,
        status: "CANCELLED",
        items: [],
      };

      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        customerId: 10,
        status: "PENDING",
      });

      prismaMock.order.update.mockResolvedValue(updatedOrder);

      await ordersService.updateOrderStatus(1, "CANCELLED");

      expect(createNotification).toHaveBeenCalledWith({
        userId: 10,
        type: "ORDER STATUS UPDATED",
        message: "Your order 1 is now CANCELLED.",
      });
    });

    it("delegates READY status to markOrderReady", async () => {
      const markOrderReadySpy = jest
        .spyOn(ordersService, "markOrderReady")
        .mockResolvedValue({
          id: 1,
          customerId: 5,
          status: "READY",
        });

      const result = await ordersService.updateOrderStatus(
        1,
        "READY"
      );

      expect(markOrderReadySpy).toHaveBeenCalledWith(1);
      expect(result.status).toBe("READY");

      markOrderReadySpy.mockRestore();
    });

    it("delegates SERVED status to completeOrder", async () => {
      const completeOrderSpy = jest
        .spyOn(ordersService, "completeOrder")
        .mockResolvedValue({
          id: 1,
          customerId: 5,
          status: "SERVED",
        });

      const result = await ordersService.updateOrderStatus(
        1,
        "SERVED"
      );

      expect(completeOrderSpy).toHaveBeenCalledWith(1);
      expect(result.status).toBe("SERVED");

      completeOrderSpy.mockRestore();
    });

    it("propagates notification errors after updating the order", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        customerId: 5,
        status: "PENDING",
      });

      prismaMock.order.update.mockResolvedValue({
        id: 1,
        customerId: 5,
        status: "PREPARING",
        items: [],
      });

      createNotification.mockRejectedValue(
        new Error("Notification failed")
      );

      await expect(
        ordersService.updateOrderStatus(1, "PREPARING")
      ).rejects.toThrow("Notification failed");

      expect(prismaMock.order.update).toHaveBeenCalled();
    });
  });

  // ============================================================
  // markOrderReady
  // ============================================================

  describe("markOrderReady", () => {
    const preparingOrder = {
      id: 1,
      status: "PREPARING",
      customerId: 5,
      totalPrice: 2000,
      items: [
        {
          id: 1,
          quantity: 2,
          unitPrice: 1000,
          orderId: 1,
          menuItemId: 1,
          menuItem: {
            id: 1,
            name: "Tomato Stew",
            menuItemIngredients: [
              {
                id: 1,
                quantityUsed: 2,
                menuItemId: 1,
                inventoryItemId: 6,
              },
              {
                id: 2,
                quantityUsed: 1,
                menuItemId: 1,
                inventoryItemId: 9,
              },
            ],
          },
        },
      ],
    };

    it("throws when the order does not exist", async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      await expect(
        ordersService.markOrderReady(999)
      ).rejects.toThrow("Order not found");

      expect(createNotification).not.toHaveBeenCalled();
    });

    it("prevents marking a SERVED order as ready", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        status: "SERVED",
        customerId: 5,
        items: [],
      });

      await expect(
        ordersService.markOrderReady(1)
      ).rejects.toThrow("Order has already been completed");

      expect(createNotification).not.toHaveBeenCalled();
    });

    it("prevents marking a CANCELLED order as ready", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        status: "CANCELLED",
        customerId: 5,
        items: [],
      });

      await expect(
        ordersService.markOrderReady(1)
      ).rejects.toThrow(
        "Cancelled orders cannot be marked ready"
      );

      expect(createNotification).not.toHaveBeenCalled();
    });

    it("only allows PREPARING orders to be marked ready", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        status: "PENDING",
        customerId: 5,
        items: [],
      });

      await expect(
        ordersService.markOrderReady(1)
      ).rejects.toThrow(
        "Only orders currently being prepared can be marked ready"
      );

      expect(createNotification).not.toHaveBeenCalled();
    });

    it("calculates inventory usage based on recipe quantity and order quantity", async () => {
      prismaMock.order.findUnique.mockResolvedValue(
        preparingOrder
      );

      prismaMock.inventoryItem.updateMany.mockResolvedValue({
        count: 1,
      });

      prismaMock.order.update.mockResolvedValue({
        id: 1,
        customerId: 5,
        status: "READY",
        items: [],
      });

      await ordersService.markOrderReady(1);

      // Tomato: 2 units per menu item × 2 ordered = 4
      expect(
        prismaMock.inventoryItem.updateMany
      ).toHaveBeenCalledWith({
        where: {
          id: 6,
          quantity: {
            gte: 4,
          },
        },
        data: {
          quantity: {
            decrement: 4,
          },
        },
      });

      // Onion: 1 unit per menu item × 2 ordered = 2
      expect(
        prismaMock.inventoryItem.updateMany
      ).toHaveBeenCalledWith({
        where: {
          id: 9,
          quantity: {
            gte: 2,
          },
        },
        data: {
          quantity: {
            decrement: 2,
          },
        },
      });
    });

    it("decrements every required inventory item", async () => {
      prismaMock.order.findUnique.mockResolvedValue(
        preparingOrder
      );

      prismaMock.inventoryItem.updateMany.mockResolvedValue({
        count: 1,
      });

      prismaMock.order.update.mockResolvedValue({
        id: 1,
        customerId: 5,
        status: "READY",
        items: [],
      });

      await ordersService.markOrderReady(1);

      expect(
        prismaMock.inventoryItem.updateMany
      ).toHaveBeenCalledTimes(2);
    });

    it("uses an atomic quantity check before decrementing inventory", async () => {
      prismaMock.order.findUnique.mockResolvedValue(
        preparingOrder
      );

      prismaMock.inventoryItem.updateMany.mockResolvedValue({
        count: 1,
      });

      prismaMock.order.update.mockResolvedValue({
        id: 1,
        customerId: 5,
        status: "READY",
        items: [],
      });

      await ordersService.markOrderReady(1);

      expect(
        prismaMock.inventoryItem.updateMany
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            quantity: {
              gte: expect.any(Number),
            },
          }),
        })
      );
    });

    it("throws when there is insufficient inventory", async () => {
      prismaMock.order.findUnique.mockResolvedValue(
        preparingOrder
      );

      prismaMock.inventoryItem.updateMany.mockResolvedValue({
        count: 0,
      });

      await expect(
        ordersService.markOrderReady(1)
      ).rejects.toThrow(
        "Insufficient inventory for inventory item 6"
      );

      expect(createNotification).not.toHaveBeenCalled();
    });

    it("does not mark the order READY when inventory is insufficient", async () => {
      prismaMock.order.findUnique.mockResolvedValue(
        preparingOrder
      );

      prismaMock.inventoryItem.updateMany.mockResolvedValue({
        count: 0,
      });

      await expect(
        ordersService.markOrderReady(1)
      ).rejects.toThrow();

      expect(prismaMock.order.update).not.toHaveBeenCalled();
    });

    it("marks the order as READY after successful inventory deduction", async () => {
      prismaMock.order.findUnique.mockResolvedValue(
        preparingOrder
      );

      prismaMock.inventoryItem.updateMany.mockResolvedValue({
        count: 1,
      });

      const resultOrder = {
        id: 1,
        customerId: 5,
        status: "READY",
        items: [],
      };

      prismaMock.order.update.mockResolvedValue(resultOrder);

      const result = await ordersService.markOrderReady(1);

      expect(prismaMock.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 1,
          },
          data: {
            status: "READY",
          },
        })
      );

      expect(result.status).toBe("READY");
    });

    it("notifies the customer after marking the order READY", async () => {
      prismaMock.order.findUnique.mockResolvedValue(
        preparingOrder
      );

      prismaMock.inventoryItem.updateMany.mockResolvedValue({
        count: 1,
      });

      const resultOrder = {
        id: 1,
        customerId: 5,
        status: "READY",
        items: [],
      };

      prismaMock.order.update.mockResolvedValue(resultOrder);

      await ordersService.markOrderReady(1);

      expect(createNotification).toHaveBeenCalledWith({
        userId: 5,
        type: "ORDER STATUS UPDATED",
        message: "Your order 1 is now READY.",
      });
    });

    it("executes the ready operation inside a Prisma transaction", async () => {
      prismaMock.order.findUnique.mockResolvedValue(
        preparingOrder
      );

      prismaMock.inventoryItem.updateMany.mockResolvedValue({
        count: 1,
      });

      prismaMock.order.update.mockResolvedValue({
        id: 1,
        customerId: 5,
        status: "READY",
        items: [],
      });

      await ordersService.markOrderReady(1);

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });

    it("propagates notification errors after marking the order READY", async () => {
      prismaMock.order.findUnique.mockResolvedValue(
        preparingOrder
      );

      prismaMock.inventoryItem.updateMany.mockResolvedValue({
        count: 1,
      });

      prismaMock.order.update.mockResolvedValue({
        id: 1,
        customerId: 5,
        status: "READY",
        items: [],
      });

      createNotification.mockRejectedValue(
        new Error("Notification failed")
      );

      await expect(
        ordersService.markOrderReady(1)
      ).rejects.toThrow("Notification failed");

      expect(prismaMock.order.update).toHaveBeenCalled();
    });
  });

  // ============================================================
  // completeOrder
  // ============================================================

  describe("completeOrder", () => {
    const readyOrder = {
      id: 1,
      status: "READY",
      totalPrice: 2000,
      customerId: 5,
      items: [
        {
          id: 1,
          quantity: 2,
          unitPrice: 1000,
          orderId: 1,
          menuItemId: 1,
          menuItem: {
            id: 1,
            name: "Tomato Stew",
            menuItemIngredients: [
              {
                id: 1,
                quantityUsed: 2,
                menuItemId: 1,
                inventoryItemId: 6,
              },
              {
                id: 2,
                quantityUsed: 1,
                menuItemId: 1,
                inventoryItemId: 9,
              },
            ],
          },
        },
      ],
    };

    it("throws when the order does not exist", async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      await expect(
        ordersService.completeOrder(999)
      ).rejects.toThrow("Order not found");

      expect(createNotification).not.toHaveBeenCalled();
    });

    it("prevents completing an already SERVED order", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        status: "SERVED",
        customerId: 5,
        items: [],
      });

      await expect(
        ordersService.completeOrder(1)
      ).rejects.toThrow("Order has already been completed");

      expect(createNotification).not.toHaveBeenCalled();
    });

    it("prevents completing a CANCELLED order", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        status: "CANCELLED",
        customerId: 5,
        items: [],
      });

      await expect(
        ordersService.completeOrder(1)
      ).rejects.toThrow(
        "Cancelled orders cannot be completed"
      );

      expect(createNotification).not.toHaveBeenCalled();
    });

    it("only allows READY orders to be completed", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        status: "PREPARING",
        customerId: 5,
        items: [],
      });

      await expect(
        ordersService.completeOrder(1)
      ).rejects.toThrow("Only ready orders can be completed");

      expect(createNotification).not.toHaveBeenCalled();
    });

    it("ensures an invoice exists before completing the order", async () => {
      prismaMock.order.findUnique.mockResolvedValue(
        readyOrder
      );

      prismaMock.order.update.mockResolvedValue({
        id: 1,
        customerId: 5,
        status: "SERVED",
        items: [],
      });

      await ordersService.completeOrder(1);

      expect(
        invoiceService.ensureInvoiceExists
      ).toHaveBeenCalledWith(1, prismaMock);
    });

    it("does not deduct inventory when completing the order", async () => {
      prismaMock.order.findUnique.mockResolvedValue(
        readyOrder
      );

      prismaMock.order.update.mockResolvedValue({
        id: 1,
        customerId: 5,
        status: "SERVED",
        items: [],
      });

      await ordersService.completeOrder(1);

      expect(
        prismaMock.inventoryItem.updateMany
      ).not.toHaveBeenCalled();
    });

    it("marks the order as SERVED after successful completion", async () => {
      prismaMock.order.findUnique.mockResolvedValue(
        readyOrder
      );

      const servedOrder = {
        id: 1,
        customerId: 5,
        status: "SERVED",
        items: [],
      };

      prismaMock.order.update.mockResolvedValue(servedOrder);

      const result = await ordersService.completeOrder(1);

      expect(prismaMock.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 1,
          },
          data: {
            status: "SERVED",
          },
        })
      );

      expect(result.status).toBe("SERVED");
    });

    it("notifies the customer after completing the order", async () => {
      prismaMock.order.findUnique.mockResolvedValue(
        readyOrder
      );

      const servedOrder = {
        id: 1,
        customerId: 5,
        status: "SERVED",
        items: [],
      };

      prismaMock.order.update.mockResolvedValue(servedOrder);

      await ordersService.completeOrder(1);

      expect(createNotification).toHaveBeenCalledWith({
        userId: 5,
        type: "ORDER COMPLETED",
        message:
          "Your order 1 has been completed and served. Enjoy your meal!",
      });
    });

    it("executes the completion inside a Prisma transaction", async () => {
      prismaMock.order.findUnique.mockResolvedValue(
        readyOrder
      );

      prismaMock.order.update.mockResolvedValue({
        id: 1,
        customerId: 5,
        status: "SERVED",
        items: [],
      });

      await ordersService.completeOrder(1);

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });

    it("propagates notification errors after completing the order", async () => {
      prismaMock.order.findUnique.mockResolvedValue(
        readyOrder
      );

      prismaMock.order.update.mockResolvedValue({
        id: 1,
        customerId: 5,
        status: "SERVED",
        items: [],
      });

      createNotification.mockRejectedValue(
        new Error("Notification failed")
      );

      await expect(
        ordersService.completeOrder(1)
      ).rejects.toThrow("Notification failed");

      expect(prismaMock.order.update).toHaveBeenCalled();
    });
  });

  // ============================================================
  // getKitchenOrders
  // ============================================================

  describe("getKitchenOrders", () => {
    it("returns PENDING and PREPARING orders", async () => {
      const kitchenOrders = [
        {
          id: 1,
          status: "PENDING",
        },
        {
          id: 2,
          status: "PREPARING",
        },
      ];

      prismaMock.order.findMany.mockResolvedValue(kitchenOrders);

      const result = await ordersService.getKitchenOrders();

      expect(prismaMock.order.findMany).toHaveBeenCalledWith({
        where: {
          status: {
            in: ["PENDING", "PREPARING"],
          },
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      expect(result).toEqual(kitchenOrders);
    });

    it("returns an empty array when there are no kitchen orders", async () => {
      prismaMock.order.findMany.mockResolvedValue([]);

      const result = await ordersService.getKitchenOrders();

      expect(result).toEqual([]);
    });
  });
});