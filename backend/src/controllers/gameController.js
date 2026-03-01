const Question = require("../models/Question");
const Answer = require("../models/Answer");
const Participant = require("../models/Participant");
const GameState = require('../models/GameState')
const mongoose = require("mongoose");

/* ==============================
   TIER LOGIC
============================== */
const tierConfig = {
  1: { profit: 2, loss: 0.25 },
  2: { profit: 3, loss: 0.50 },
  3: { profit: 4, loss: 0.75 },
  4: { profit: 5, loss: 1.00 }
};

/* ==============================
   ADMIN: PUSH QUESTION
============================== */
const pushQuestionController = async (req, res) => {
  try {
    const { questionId } = req.body;
    if (!questionId) {
      return res.status(400).json({ message: "questionId is required" });
    }

    await Question.updateMany({}, { isActive: false });

    let question = null;
    const update = { isActive: true, startTime: new Date() };
    const options = { returnDocument: "after" };

    if (mongoose.Types.ObjectId.isValid(questionId)) {
      question = await Question.findByIdAndUpdate(questionId, update, options);
    }

    if (!question) {
      question = await Question.findOneAndUpdate(
        { questionId: String(questionId) },
        update,
        options
      );
    }

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
        hint: "Use existing Mongo _id or questionId (e.g. 1..10 after seeding)"
      });
    }

    res.json({
      message: "Question pushed successfully",
      question
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


/* ==============================
   PARTICIPANT: SUBMIT ANSWER
============================== */
const submitAnswerController = async (req, res) => {
  try {
    const { selectedOption, tier, investmentAmount } = req.body;
    const participant = req.participant;

    const question = await Question.findOne({ isActive: true });
    if (!question) return res.status(400).json({ message: "No active question" });

    const timeDiff = (new Date() - new Date(question.startTime)) / 1000;
    if (timeDiff > 30) {
      return res.status(403).json({ message: "Time over" });
    }

    const alreadyAnswered = await Answer.findOne({
      teamId: participant.teamId,
      questionId: question._id
    });

    if (alreadyAnswered) {
      return res.status(400).json({ message: "Already submitted" });
    }

    if (participant.balance < investmentAmount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const isCorrect = selectedOption === question.correctAnswer;

    await Answer.create({
      teamId: participant.teamId,
      questionId: question._id,
      selectedOption,
      tier,
      investmentAmount,
      isCorrect
    });

    res.json({ message: "Answer submitted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Submit answer failed" });
  }
};


/* ==============================
   ADMIN: REVEAL ANSWER
============================== */
const revealAnswerController = async (req, res) => {
  try {
    const question = await Question.findOne({ isActive: true });
    if (!question) return res.status(400).json({ message: "No active question" });

    const answers = await Answer.find({ questionId: question._id });

    for (let ans of answers) {
      const participant = await Participant.findOne({ teamId: ans.teamId });

      const tierData = tierConfig[ans.tier];

      if (ans.isCorrect) {
        participant.balance += ans.investmentAmount * tierData.profit;
      } else {
        participant.balance -= ans.investmentAmount * tierData.loss;
      }

      await participant.save();
    }

    question.isActive = false;
    await question.save();

    const leaderboard = await Participant.find().sort({ balance: -1 }).limit(5);

    res.json({
      message: "Answer revealed & balances updated",
      correctAnswer: question.correctAnswer,
      leaderboard
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Reveal failed" });
  }
};




const getDashboard = async (req, res) => {
  try {
    // get game state
    const gameState = await GameState.findOne().populate("currentQuestion");

    // top 5 participants by balance
    const topParticipants = await Participant.find()
      .sort({ balance: -1 })
      .limit(5)
      .select("teamId balance");

    // all participants (for admin dashboard table)
    const allParticipants = await Participant.find()
      .select("teamId balance currentInvestment");

    res.status(200).json({
      success: true,
      currentQuestion: gameState?.currentQuestion || null,
      totalMoneyInvested: gameState?.totalInvested || 0,
      top5Participants: topParticipants,
      participants: allParticipants
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard"
    });
  }
};

module.exports = {
  pushQuestionController,
  submitAnswerController,
  revealAnswerController,
  getDashboard,
};