const authServices = require("../services/auth.service");
const getSafeErrorMessage = require("../utils/errorMessage");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await authServices.register(name, email, password);
    res.status(201).json(user);

  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't create your account") });
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authServices.login(email, password);

    res.cookie('jwt', user.refreshToken, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === "production"
    });
    res.status(200).json({ 
      message: "Login successful",
      "accessToken": user.accessToken,
      user: {
        id: user.user.id,
        name: user.user.name,
        email: user.user.email,
        role: user.user.role,
        mustChangePassword: user.user.mustChangePassword
      }
    });
    
  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't log you in") });
  }
}

exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.jwt;
    const accessToken = await authServices.refresh(refreshToken);
    res.status(200).json({ accessToken: accessToken });

  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't log you out") });
  }
}

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.jwt;
    await authServices.logout(refreshToken);

    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    });
    res.status(200).json({ message: "Logged out successfully" })
    
    } catch (err) {
      res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't log you out") });
    }
}

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;
    const result = await authServices.changePassword(userId, oldPassword, newPassword);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: getSafeErrorMessage(err, "Couldn't change your password") });
  }
}