const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema({
  teamId: String,
  password: String,
  balance: { type: Number, default: 1000 }
});

module.exports = mongoose.model("Participant", participantSchema);