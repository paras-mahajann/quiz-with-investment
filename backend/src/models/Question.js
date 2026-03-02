const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionId: { type: String, unique: true, sparse: true },
  question: String,
  options: [String],
  correctAnswer: String,
  difficulty: String,
  durationSeconds: { type: Number, default: 30 },
  isActive: { type: Boolean, default: false },
  startTime: Date
});

module.exports = mongoose.model("Question", questionSchema);
