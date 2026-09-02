const prisma = require("../prisma/client");
const bcrypt = require("bcrypt");
const { getCache, setCache } = require("../utils/cache");

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

  const allowedRoles = ["WAITER", "CHEF"];

  if (!allowedRoles.includes(role)) {
    return {
      error: true,
      message: "Staff role must be either WAITER or CHEF",
    };
  }

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
  const cacheKey = "admin:dashboard";
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const [
    totalOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    totalMenuItems,
    totalInventoryItems,
  ] = await Promise.all([
    prisma.order.count(),

    prisma.order.count({
      where: {
        status: "SERVED",
      },
    }),

    prisma.order.count({
      where: {
        status: "CANCELLED",
      },
    }),

    prisma.order.aggregate({
      where: {
        status: "SERVED",
      },
      _sum: {
        totalPrice: true,
      },
    }),

    prisma.menuItem.count(),

    prisma.inventoryItem.count(),
  ]);

  const result = {
    totalOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue: totalRevenue._sum.totalPrice || 0,
    totalMenuItems,
    totalInventoryItems,
  };

  await setCache(cacheKey, result, 60); // 1 min
  return result;
};