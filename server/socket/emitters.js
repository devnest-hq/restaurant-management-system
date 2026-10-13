const STAFF_ROOMS = ["role-CHEF", "role-WAITER", "role-ADMIN"];

exports.emitNewOrder = (io, order) => {
  if (io) io.to(STAFF_ROOMS).emit("new-order", order);
};

exports.emitOrderStatusUpdated = (io, order) => {
  if (io) io.to([...STAFF_ROOMS, `user-${order.customerId}`]).emit("order-status-updated", order);
};