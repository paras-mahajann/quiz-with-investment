const participantModel = require('../models/Participant');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { emitGameEvent } = require("../socket");
const { getAuthCookieOptions } = require("../utils/cookieOptions");

const loginController = async (req, res) => {
  try {
    const { password } = req.body;
    const teamId = String(req.body?.teamId || "").trim();

    if (!teamId || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user = await participantModel.findOne({ teamId });
    if (!user) {
      return res.status(404).json({ message: "This team id does not exist" });
    }

    const hash = crypto.createHash('sha256').update(password).digest('hex');

    if (user.password !== hash) {
      return res.status(401).json({ message: "Invalid Password!" });
    }

    user.lastSeenAt = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, teamId: user.teamId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie("token", token, getAuthCookieOptions());

    res.status(200).json({
      message: "Logged in successfully",
      participant: {
        teamId: user.teamId,
        balance: user.balance
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

const registerController = async (req, res) => {
  return res.status(403).json({
    message: "Participant self-registration is disabled. Contact admin."
  });
};

const registerParticipantByAdminController = async (req, res) => {
  try {
    const { password, balance } = req.body;
    const teamId = String(req.body?.teamId || "").trim();

    if (!teamId || !password) {
      return res.status(400).json({ message: "Team ID and password are required" });
    }

    const existing = await participantModel.findOne({ teamId });
    if (existing) {
      return res.status(409).json({ message: "Team already registered!" });
    }

    const hash = crypto.createHash("sha256").update(password).digest("hex");
    const normalizedBalance = Number(balance);
    const initialBalance = Number.isFinite(normalizedBalance) && normalizedBalance >= 0
      ? normalizedBalance
      : 1000;

    const user = await participantModel.create({
      teamId,
      password: hash,
      balance: initialBalance,
      totalInvested: 0,
      lastSeenAt: new Date()
    });

    res.status(201).json({
      message: "Participant registered successfully",
      participant: {
        teamId: user.teamId,
        balance: user.balance
      }
    });
    emitGameEvent("participant:registered", {
      teamId: user.teamId,
      balance: user.balance
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "Team already registered!" });
    }
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  loginController,
  registerController,
  registerParticipantByAdminController
};
