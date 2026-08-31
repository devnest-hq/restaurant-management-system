process.env.TAX_RATE = "0.075";
process.env.SERVICE_CHARGE_RATE = "0.05";

jest.mock("../../prisma/client", () => require("../../prisma/client.mock"));

const prismaMock = require("../../prisma/client.mock");
const invoiceService = require("../../services/invoice.service");

describe("invoice.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ensureInvoiceExists", () => {
    it("returns the existing invoice if one already exists", async () => {
      const existingInvoice = {
        id: 1,
        orderId: 10,
        foodCost: 1000,
        tax: 75,
        serviceCharge: 50,
        discount: 0,
        grandTotal: 1125,
      };

      prismaMock.invoice.findFirst.mockResolvedValue(existingInvoice);

      const result = await invoiceService.ensureInvoiceExists(10);

      expect(result).toEqual(existingInvoice);

      expect(prismaMock.invoice.findFirst).toHaveBeenCalledWith({
        where: { orderId: 10 },
      });

      expect(prismaMock.order.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.invoice.create).not.toHaveBeenCalled();
    });

    it("throws when the order does not exist", async () => {
      prismaMock.invoice.findFirst.mockResolvedValue(null);
      prismaMock.order.findUnique.mockResolvedValue(null);

      await expect(
        invoiceService.ensureInvoiceExists(99)
      ).rejects.toThrow("Order not found");

      expect(prismaMock.invoice.create).not.toHaveBeenCalled();
    });

    it("calculates the food cost correctly", async () => {
      prismaMock.invoice.findFirst.mockResolvedValue(null);

      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        items: [
          {
            quantity: 2,
            unitPrice: 500,
          },
          {
            quantity: 3,
            unitPrice: 200,
          },
        ],
      });

      prismaMock.invoice.create.mockResolvedValue({
        id: 1,
        orderId: 1,
        foodCost: 1600,
        tax: 160,
        serviceCharge: 80,
        discount: 0,
        grandTotal: 1840,
      });

      await invoiceService.ensureInvoiceExists(1);

      expect(prismaMock.invoice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 1,
          foodCost: 1600,
        }),
      });
    });

    it("calculates tax, service charge, discount and grand total correctly", async () => {
      prismaMock.invoice.findFirst.mockResolvedValue(null);

      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        items: [
          {
            quantity: 2,
            unitPrice: 500,
          },
        ],
      });

      prismaMock.invoice.create.mockResolvedValue({
        id: 1,
      });

      await invoiceService.ensureInvoiceExists(1);

      const createCall = prismaMock.invoice.create.mock.calls[0][0];

      expect(createCall.data.foodCost).toBe(1000);
      expect(createCall.data.discount).toBe(0);

      expect(createCall.data.tax).toBeCloseTo(
        1000 * parseFloat(process.env.TAX_RATE)
      );

      expect(createCall.data.serviceCharge).toBeCloseTo(
        1000 * parseFloat(process.env.SERVICE_CHARGE_RATE)
      );

      expect(createCall.data.grandTotal).toBeCloseTo(
        1000 +
        1000 * parseFloat(process.env.TAX_RATE) +
        1000 * parseFloat(process.env.SERVICE_CHARGE_RATE)
      );
    });

    it("creates an invoice with the correct order ID", async () => {
      prismaMock.invoice.findFirst.mockResolvedValue(null);

      prismaMock.order.findUnique.mockResolvedValue({
        id: 15,
        items: [
          {
            quantity: 1,
            unitPrice: 1000,
          },
        ],
      });

      prismaMock.invoice.create.mockResolvedValue({
        id: 5,
        orderId: 15,
      });

      await invoiceService.ensureInvoiceExists(15);

      expect(prismaMock.invoice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 15,
        }),
      });
    });

    it("uses the supplied transaction client when provided", async () => {
      const txMock = {
        invoice: {
          findFirst: jest.fn(),
          create: jest.fn(),
        },
        order: {
          findUnique: jest.fn(),
        },
      };

      const existingInvoice = {
        id: 10,
        orderId: 20,
      };

      txMock.invoice.findFirst.mockResolvedValue(existingInvoice);

      const result = await invoiceService.ensureInvoiceExists(20, txMock);

      expect(result).toEqual(existingInvoice);

      expect(txMock.invoice.findFirst).toHaveBeenCalledWith({
        where: { orderId: 20 },
      });

      expect(prismaMock.invoice.findFirst).not.toHaveBeenCalled();
    });

    it("creates an invoice using the supplied transaction client", async () => {
      const txMock = {
        invoice: {
          findFirst: jest.fn(),
          create: jest.fn(),
        },
        order: {
          findUnique: jest.fn(),
        },
      };

      txMock.invoice.findFirst.mockResolvedValue(null);

      txMock.order.findUnique.mockResolvedValue({
        id: 30,
        items: [
          {
            quantity: 2,
            unitPrice: 500,
          },
        ],
      });

      txMock.invoice.create.mockResolvedValue({
        id: 20,
        orderId: 30,
      });

      await invoiceService.ensureInvoiceExists(30, txMock);

      expect(txMock.invoice.create).toHaveBeenCalled();

      expect(prismaMock.invoice.create).not.toHaveBeenCalled();
    });
  });

  describe("getInvoiceByOrderId", () => {
    const invoice = {
      id: 1,
      orderId: 10,
      foodCost: 1000,
      tax: 75,
      serviceCharge: 50,
      discount: 0,
      grandTotal: 1125,
      order: {
        id: 10,
        customerId: 5,
        items: [
          {
            id: 1,
            quantity: 1,
            unitPrice: 1000,
            menuItem: {
              id: 1,
              name: "Tomato Stew",
            },
          },
        ],
        customer: {
          id: 5,
          name: "John Doe",
          email: "john@example.com",
        },
      },
    };

    it("returns an invoice by order ID", async () => {
      prismaMock.invoice.findFirst.mockResolvedValue(invoice);

      const result = await invoiceService.getInvoiceByOrderId(10, {
        role: "ADMIN",
        userId: 1,
      });

      expect(result).toEqual(invoice);

      expect(prismaMock.invoice.findFirst).toHaveBeenCalledWith({
        where: { orderId: 10 },
        include: {
          order: {
            include: {
              items: { include: { menuItem: true } },
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    });

    it("parses the order ID when it is provided as a string", async () => {
      prismaMock.invoice.findFirst.mockResolvedValue(invoice);

      await invoiceService.getInvoiceByOrderId("10", {
        role: "ADMIN",
        userId: 1,
      });

      expect(prismaMock.invoice.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderId: 10 },
        })
      );
    });

    it("throws when the invoice does not exist", async () => {
      prismaMock.invoice.findFirst.mockResolvedValue(null);

      await expect(
        invoiceService.getInvoiceByOrderId(99, {
          role: "ADMIN",
          userId: 1,
        })
      ).rejects.toThrow("Invoice not found");
    });

    it("allows a customer to access their own invoice", async () => {
      prismaMock.invoice.findFirst.mockResolvedValue(invoice);

      const result = await invoiceService.getInvoiceByOrderId(10, {
        role: "CUSTOMER",
        userId: 5,
      });

      expect(result).toEqual(invoice);
    });

    it("blocks a customer from accessing another customer's invoice", async () => {
      prismaMock.invoice.findFirst.mockResolvedValue(invoice);

      await expect(
        invoiceService.getInvoiceByOrderId(10, {
          role: "CUSTOMER",
          userId: 999,
        })
      ).rejects.toThrow("Access denied");
    });

    it("sets the access denied error status to 403", async () => {
      prismaMock.invoice.findFirst.mockResolvedValue(invoice);

      try {
        await invoiceService.getInvoiceByOrderId(10, {
          role: "CUSTOMER",
          userId: 999,
        });

        throw new Error("Expected function to throw");
      } catch (err) {
        expect(err.message).toBe("Access denied");
        expect(err.status).toBe(403);
      }
    });

    it("allows an admin to access any invoice", async () => {
      prismaMock.invoice.findFirst.mockResolvedValue(invoice);

      const result = await invoiceService.getInvoiceByOrderId(10, {
        role: "ADMIN",
        userId: 999,
      });

      expect(result).toEqual(invoice);
    });

    it("allows a chef to access an invoice", async () => {
      prismaMock.invoice.findFirst.mockResolvedValue(invoice);

      const result = await invoiceService.getInvoiceByOrderId(10, {
        role: "CHEF",
        userId: 999,
      });

      expect(result).toEqual(invoice);
    });

    it("allows a waiter to access an invoice", async () => {
      prismaMock.invoice.findFirst.mockResolvedValue(invoice);

      const result = await invoiceService.getInvoiceByOrderId(10, {
        role: "WAITER",
        userId: 999,
      });

      expect(result).toEqual(invoice);
    });
  });
});