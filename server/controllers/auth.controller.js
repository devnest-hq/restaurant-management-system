const authServices = require("../services/auth.service");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await authServices.register(name, email, password);
    res.status(201).json(user);

  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  }
}

exports.registerStaff = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await authServices.registerStaff(name, email, role);
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

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
         role: user.user.role
       }
     });
    
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  }
}

exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.jwt;
    const accessToken = await authServices.refresh(refreshToken);
    res.status(200).json({ accessToken: accessToken });

  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  }
}

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.jwt;
    await authServices.logout(refreshToken);

    res.cookie('jwt', user.refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production"
     });
    res.status(200).json({ message: "Logged out successfully" })
    
  } catch (err) {
    console.log(err.message);
    res.status(err.status || 500).json({ error: err.message })
  }
}