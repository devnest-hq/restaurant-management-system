const prisma = require("../prisma/client");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

exports.register = async (name, email, password) => {
  if (!name || !email || !password) {
    const err = new Error("Name, email and password are required");
    err.status = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });
    const { password: _, ...safeUser } = user;
    return safeUser;

  } catch (err) {
    if (err.code === "P2002") {
      const error = new Error("Email already exists");
      error.status = 409;
      throw error;
    }
    throw err;
  }
}

exports.registerStaff = async (name, email, role) => {
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
        role
      }
    });
    const { password: _, ...safeUser } = user;
    return safeUser;
  } catch (err) {
    if (err.code === "P2002") {
      const error = new Error("Email already exists");
      error.status = 409;
      throw error;
    }
    throw err;
  }
};

exports.login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email }});

  if (!user) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  // Generate access and refresh tokens
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Save refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt
    }
  });

  const { password: _, ...safeUser } = user;

  return {
    user: safeUser,
    accessToken,
    refreshToken
  };
}

exports.refresh = async (refreshToken) => {
  if (!refreshToken) {
    const err = new Error("No refresh token provided");
    err.status = 401;
    throw err;
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken }
  });

  if (!storedToken) {
    const err = new Error("Invalid refresh token");
    err.status = 403;
    throw err;
  }

  // delete refresh token from db if expired
  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({
      where: { id: storedToken.id }
    });
    const err = new Error("Refresh token expired");
    err.status = 403;
    throw err;
  }

  let decoded;
  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
  } catch (err) {
    const error = new Error("Invalid refresh token");
    error.status = 403;
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId}});
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
  );

  return accessToken;
}

exports.logout = async (refreshToken) => {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    });
  }
}