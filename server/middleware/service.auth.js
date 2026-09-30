const crypto = require("crypto");

const serviceAuth = (req, res, next) => {
  const expected = process.env.PAYMENT_SERVICE_API_KEY;

  if (!expected) {
    console.error("PAYMENT_SERVICE_API_KEY is not set");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or malformed authorization header" });
  }

  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!valid) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  next();
};

module.exports = serviceAuth;