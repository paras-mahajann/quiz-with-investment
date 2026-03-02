const jwt = require("jsonwebtoken");
const Participant = require("../models/Participant");

const participantAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const participant = await Participant.findById(decoded.id).select("-password");

    if (!participant) {
      return res.status(401).json({ message: "Participant not found" });
    }

    // Track online presence by recent authenticated activity.
    const now = new Date();
    await Participant.updateOne(
      { _id: participant._id },
      { $set: { lastSeenAt: now } }
    );
    participant.lastSeenAt = now;

    req.participant = participant;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = participantAuthMiddleware; // 👈 IMPORTANT (not object)
