const prisma = require("../prisma/client");

exports.createNotification = async ({ userId, type, message }) => {
  if (!userId || !type || !message) {
    const err = new Error("Provide the notifications type, message and the user it belongs to");
    throw err;
  }

  try {
    return await prisma.notification.create({
      data: {
        userId: parseInt(userId),
        type,
        message
      }
    });
  } catch (err) {
    throw err;
  }
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
  if (!userId || userId === undefined) {
    const err = new Error("Provide user ID");
    err.status = 400;
    throw err;
  }

  return await prisma.notification.findMany({
    where: { userId: parseInt(userId) }
  });
}

exports.readNotification = async (id, userId) => {
  const notification = await prisma.notification.findUnique({
    where: { id: parseInt(id) }
  });

  if (userId !== notification.userId) {
    const err = new Error("Access Denied: notification owned by another user");
    err.status = 404;
    throw err;
  }

  return await prisma.notification.update({
    where: { id: parseInt(id) },
    data: { isRead: true }
  });
}

exports.readAllNotifications = async (userId) => {
  await prisma.notification.updateMany({
    where: { userId: parseInt(userId) },
    data: { isRead: true }
  });
}