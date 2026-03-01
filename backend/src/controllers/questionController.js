const Question = require("../models/Question");
const Participant = require("../models/Participant");

const pushQuestion = async (req, res) => {
  try {
    const { question, questionId, ans, difficulty } = req.body;

    if (!question || !questionId || !ans) {
      return res.status(400).json({ message: "question, questionId and ans are required" });
    }

    const existingQuestion = await Question.findOne({ questionId });
    if (existingQuestion) {
      return res.status(409).json({ message: "Question with this questionId already exists" });
    }

    const newQuestion = await Question.create({
      question,
      questionId,
      ans,
      difficulty
    });

    return res.status(201).json({
      message: "Question pushed successfully",
      question: newQuestion
    });
  } catch (error) {
    console.error("Push Question Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const revealAnswer = async (req, res) => {
  try {
    const { questionId } = req.body;

    if (!questionId) {
      return res.status(400).json({ message: "questionId is required" });
    }

    const question = await Question.findOne({ questionId });
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    return res.status(200).json({
      message: "Answer revealed",
      questionId: question.questionId,
      answer: question.ans
    });
  } catch (error) {
    console.error("Reveal Answer Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Participant.find({}, { teamId: 1, balance: 1, _id: 0 })
      .sort({ balance: -1, teamId: 1 });

    return res.status(200).json({
      message: "Leaderboard fetched successfully",
      leaderboard
    });
  } catch (error) {
    console.error("Get Leaderboard Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  pushQuestion,
  revealAnswer,
  getLeaderboard
};
