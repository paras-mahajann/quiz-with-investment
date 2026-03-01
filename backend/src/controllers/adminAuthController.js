const adminModel = require("../models/Admin");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

/**
 * Admin Register
 */
const adminRegisterController = async (req, res) => {
  try {
    const { adminId, password } = req.body;

    if (!adminId || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const isAdminExist = await adminModel.findOne({ adminId });
    if (isAdminExist) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const hash = crypto.createHash("sha256").update(password).digest("hex");

    const admin = await adminModel.create({
      adminId,
      password: hash
    });

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000
    });

    res.status(201).json({
      message: "Admin registered successfully",
      admin: {
        adminId: admin.adminId
      }
    });

  } catch (error) {
    console.error("Admin Register Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * Admin Login
 */
const adminLoginController = async (req, res) => {
  try {
    const { adminId, password } = req.body;

    if (!adminId || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const admin = await adminModel.findOne({ adminId });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const hash = crypto.createHash("sha256").update(password).digest("hex");

    if (admin.password !== hash) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000
    });

    res.status(200).json({
      message: "Admin logged in successfully",
      admin: {
        adminId: admin.adminId
      }
    });

  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  adminRegisterController,
  adminLoginController
};