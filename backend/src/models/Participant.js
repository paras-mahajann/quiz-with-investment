const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema({
  lastAnsweredQuestion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question"
  },
  currentInvestment: Number,
  teamId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  lastSeenAt: { type: Date, default: Date.now },
  balance: { type: Number, default: 1000 }
});

module.exports = mongoose.model("Participant", participantSchema);
