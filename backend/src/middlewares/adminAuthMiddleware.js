const jwt = require("jsonwebtoken");
const adminModel = require("../models/Admin");

const adminAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access denied. No token." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await adminModel.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(401).json({ message: "Admin not found." });
    }

    req.admin = admin;
    next();

  } catch (error) {
    return res.status(401).json({ message: "Unauthorized admin." });
  }
};

module.exports = adminAuthMiddleware;