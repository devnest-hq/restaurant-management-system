const isProduction = process.env.NODE_ENV === "production";

const rawOrigins = process.env.FRONTEND_URL || (isProduction ? "" : "http://localhost:5173");

const allowedOrigins = rawOrigins
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  throw new Error("FRONTEND_URL must be set in production");
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
}

module.exports = { allowedOrigins, corsOptions }