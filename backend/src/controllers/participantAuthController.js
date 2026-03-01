const participantModel = require('../models/Participant');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const loginController = async (req, res) => {
  try {
    const { teamId, password } = req.body;

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

    const token = jwt.sign(
      { id: user._id, teamId: user.teamId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000
    });

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
  try {
    const { teamId, password } = req.body;

    if (!teamId || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const isUserExist = await participantModel.findOne({ teamId });
    if (isUserExist) {
      return res.status(409).json({ message: "Team already registered!" });
    }

    const hash = crypto.createHash('sha256').update(password).digest('hex');

    const user = await participantModel.create({
      teamId,
      password: hash,
      balance: 1000,
      totalInvested: 0
    });

    const token = jwt.sign(
      { id: user._id, teamId: user.teamId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000
    });

    res.status(201).json({
      message: "Team created successfully",
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

module.exports = {
  loginController,
  registerController
};