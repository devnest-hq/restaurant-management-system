const prisma = require("../prisma/client");

let io;

exports.setSocketIO = (socketIO) => {
  io = socketIO;
}

exports.createNotification = async ({ userId, type, message }) => {
  if (!userId || !type || !message) {
    const err = new Error("Provide the notification type, message, and the user it belongs to");
    err.status = 400;
    throw err;
  }

  const notification = await prisma.notification.create({
    data: {
      userId: parseInt(userId),
      type,
      message
    }
  });

  if (io) io.to(`user-${userId}`).emit("notification", notification);
  
  return notification;
}

exports.notifyRoles = async (roles, { type, message }, tx = prisma) => {
  const staff = await tx.user.findMany({
    where: { role: { in: roles } },
    select: { id: true },
  });

  await Promise.all(
    staff.map((user) =>
      exports.createNotification({ userId: user.id, type, message })
    )
  );
};

exports.getNotifications = async (userId) => {
  if (!userId) {
    const err = new Error("Provide user ID");
    err.status = 400;
    throw err;
  }

  return prisma.notification.findMany({
    where: { userId: parseInt(userId) },
    orderBy: { createdAt: "desc" }
  });
}

exports.readNotification = async (id, userId) => {
  const notification = await prisma.notification.findUnique({
    where: { id: parseInt(id) }
  });

  if (!notification) {
    const err = new Error("Notification not found");
    err.status = 404;
    throw err;
  }

  if (notification.userId !== userId) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  return prisma.notification.update({
    where: { id: parseInt(id) },
    data: { isRead: true }
  });
}

exports.readAllNotifications = async (userId) => {
  return prisma.notification.updateMany({
    where: { userId: parseInt(userId) },
    data: { isRead: true }
  });
}