// Only show err.message to the client when err.status is set —
// that means one of our own service functions deliberately threw it
// with a controlled, safe message (e.g. "Old password is incorrect").
// If err.status is missing, it's an unexpected error (raw Prisma/DB
// error, TypeError, etc.) — log it server-side, show a generic message.
const getSafeErrorMessage = (err, fallback = "Something went wrong. Please try again.") => {
  if (err.status) return err.message;
  console.error(err);
  return fallback;
};

module.exports = getSafeErrorMessage;