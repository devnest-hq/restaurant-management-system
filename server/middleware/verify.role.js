const verifyRole = (role = []) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  }
}

module.exports = verifyRole;
