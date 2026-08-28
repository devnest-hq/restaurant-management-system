const prisma = require("../prisma/client");
const bcrypt = require("bcrypt");

exports.createStaff = async (name, email, role) => {
  if (!name || !email || !role) {
    const err = new Error("Name, email and role are required");
    err.status = 400;
    throw err;
  }

  let password;
  if (role === "WAITER") {
    password = process.env.WAITERS_ACCESS_TOKEN_SECRET;
  } else if (role === "CHEF") {
    password = process.env.CHEFS_ACCESS_TOKEN_SECRET;
  } else {
    const err = new Error("Invalid role");
    err.status = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        mustChangePassword: true
      }
    });
    const { password: _, ...safeUser } = user;
    return { ...safeUser };
  } catch (err) {
    if (err.code === "P2002") {
      const error = new Error("Email already exists");
      error.status = 409;
      throw error;
    }
    throw err;
  }
};

exports.getAllStaff = async () => {
  const staff = await prisma.user.findMany({
    where: {
      role: {
        in: ["WAITER", "CHEF"]
      }
    },
    select: { name: true, email: true, role: true }
  });
  return staff;
};

exports.getStaffById = async (id) => {
  const staff = await prisma.user.findUnique({
    where: { id: parseInt(id), role: { in: ["WAITER", "CHEF"] } },
    select: { name: true, email: true, role: true }
  });
  return staff;
};

exports.updateStaff = async (id, name, email, role) => {
  const staffId = parseInt(id);

  // Only these roles can be assigned to staff
  const allowedRoles = ["WAITER", "CHEF"];

  // Validate the new role
  if (!allowedRoles.includes(role)) {
    return {
      error: true,
      message: "Staff role must be either WAITER or CHEF",
    };
  }

  // Make sure the existing user is actually a staff member
  const existing = await prisma.user.findUnique({
    where: { id: staffId },
  });

  if (!existing || !allowedRoles.includes(existing.role)) {
    return null;
  }

  const staff = await prisma.user.update({
    where: { id: staffId },
    data: {
      name,
      email,
      role,
    },
    select: {
      name: true,
      email: true,
      role: true,
    },
  });

  return staff;
};

exports.deleteStaff = async (id) => {
  const existing = await prisma.user.findUnique({ where: { id: parseInt(id), role: { in: ["WAITER", "CHEF"] } } });
  if (!existing) {
    return null;
  }
  const staff = await prisma.user.delete({
    where: { id: parseInt(id), role: { in: ["WAITER", "CHEF"] } },
    select: { name: true, email: true, role: true }
  });
  return staff;
};

exports.mostOrderedMenuItems = async (limit = 5) => {
  const result = await prisma.$queryRaw`
    SELECT
      mi.id,
      mi.name,
      SUM(oi.quantity)::int AS total_ordered
    FROM "OrderItem" oi
    JOIN "MenuItem" mi
      ON oi."menuItemId" = mi.id
    JOIN "Order" o
      ON oi."orderId" = o.id
    WHERE o.status = 'SERVED'
    GROUP BY mi.id, mi.name
    ORDER BY total_ordered DESC
    LIMIT ${limit}
  `;

  return result;
};


exports.salesReport = async (period = "daily") => {
  const dateTruncMap = {
    daily: "day",
    weekly: "week",
    monthly: "month",
  };

  const dateTrunc = dateTruncMap[period];

  if (!dateTrunc) {
    throw new Error("Invalid period. Use daily, weekly, or monthly.");
  }

  let result;

  if (dateTrunc === "day") {
    result = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('day', "Order"."createdAt") AS period,
        SUM("Order"."totalPrice") AS total_sales
      FROM "Order"
      WHERE "Order"."status" = 'SERVED'
      GROUP BY DATE_TRUNC('day', "Order"."createdAt")
      ORDER BY period ASC
    `;
  }

  if (dateTrunc === "week") {
    result = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('week', "Order"."createdAt") AS period,
        SUM("Order"."totalPrice") AS total_sales
      FROM "Order"
      WHERE "Order"."status" = 'SERVED'
      GROUP BY DATE_TRUNC('week', "Order"."createdAt")
      ORDER BY period ASC
    `;
  }

  if (dateTrunc === "month") {
    result = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', "Order"."createdAt") AS period,
        SUM("Order"."totalPrice") AS total_sales
      FROM "Order"
      WHERE "Order"."status" = 'SERVED'
      GROUP BY DATE_TRUNC('month', "Order"."createdAt")
      ORDER BY period ASC
    `;
  }

  return result;
};

// Aggregation data from orders, menu, and inventory for admin dashboard
exports.dashboardData = async () => {
  const [
    totalOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    totalMenuItems,
    totalInventoryItems,
  ] = await Promise.all([
    // All orders
    prisma.order.count(),

    // Successfully completed orders
    prisma.order.count({
      where: {
        status: "SERVED",
      },
    }),

    // Cancelled orders
    prisma.order.count({
      where: {
        status: "CANCELLED",
      },
    }),

    // Revenue from completed orders only
    prisma.order.aggregate({
      where: {
        status: "SERVED",
      },
      _sum: {
        totalPrice: true,
      },
    }),

    // Total menu items
    prisma.menuItem.count(),

    // Total inventory items
    prisma.inventoryItem.count(),
  ]);

  return {
    totalOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue: totalRevenue._sum.totalPrice || 0,
    totalMenuItems,
    totalInventoryItems,
  };
};
