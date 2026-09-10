const prisma = require("../prisma/client");

const cleanupExpiredTokens = async () => {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    })
    console.log(`Cleaned up ${result.count} expired tokens.`);
  } catch (err) {
    console.error("Error cleaning up expired tokens:", err);
  }
}

module.exports = cleanupExpiredTokens;