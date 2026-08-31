const prisma = require("../prisma/client");

const requirePasswordChange = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { mustChangePassword: true }
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.mustChangePassword) {
      return res.status(403).json({
        error: "You must change your password before continuing",
        mustChangePassword: true
      });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify password change status" });
  }
}

module.exports = requirePasswordChange;