const Question = require("../models/Question");
const Answer = require("../models/Answer");
const Participant = require("../models/Participant");
const GameState = require('../models/GameState')
const { emitGameEvent } = require("../socket");
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
const ONLINE_WINDOW_SECONDS = 30;

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

    await GameState.findOneAndUpdate(
      {},
      {
        currentQuestion: question._id,
        totalInvested: 0
      },
      { upsert: true, new: true }
    );

    res.json({
      message: "Question pushed successfully",
      question
    });
    emitGameEvent("question:pushed", {
      questionId: String(question._id),
      startedAt: question.startTime
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
    const tierData = tierConfig[tier];
    const normalizedInvestmentAmount = Number(investmentAmount);

    if (
      !selectedOption ||
      !tierData ||
      !Number.isFinite(normalizedInvestmentAmount) ||
      normalizedInvestmentAmount <= 0
    ) {
      return res.status(400).json({
        message: "selectedOption, valid tier (1-4), and positive numeric investmentAmount are required"
      });
    }

    const question = await Question.findOne({ isActive: true });
    if (!question) return res.status(400).json({ message: "No active question" });
    if (!Array.isArray(question.options) || !question.options.includes(selectedOption)) {
      return res.status(400).json({ message: "Invalid selected option" });
    }

    const submissionWindowSeconds =
      Number.isFinite(question.durationSeconds) && question.durationSeconds > 0
        ? question.durationSeconds
        : 30;
    const timeDiff = (new Date() - new Date(question.startTime)) / 1000;
    if (timeDiff > submissionWindowSeconds) {
      return res.status(403).json({ message: "Time over" });
    }

    if (
      participant.lastAnsweredQuestion &&
      String(participant.lastAnsweredQuestion) === String(question._id)
    ) {
      return res.status(400).json({ message: "Already submitted" });
    }

    const alreadyAnswered = await Answer.findOne({
      teamId: participant.teamId,
      questionId: String(question._id)
    });

    if (alreadyAnswered) {
      return res.status(400).json({ message: "Already submitted" });
    }

    if (participant.balance < normalizedInvestmentAmount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const isCorrect = selectedOption === question.correctAnswer;

    await Answer.create({
      teamId: participant.teamId,
      questionId: String(question._id),
      selectedOption,
      tier,
      investmentAmount: normalizedInvestmentAmount,
      isCorrect,
      submittedAt: new Date()
    });

    participant.lastAnsweredQuestion = question._id;
    participant.currentInvestment = normalizedInvestmentAmount;
    await participant.save();

    await GameState.findOneAndUpdate(
      { currentQuestion: question._id },
      { $inc: { totalInvested: normalizedInvestmentAmount } },
      { upsert: true }
    );

    res.json({ message: "Answer submitted successfully" });
    emitGameEvent("answer:submitted", {
      questionId: String(question._id),
      teamId: participant.teamId,
      investmentAmount: normalizedInvestmentAmount
    });

  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ message: "Already submitted" });
    }
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

    const answers = await Answer.find({ questionId: String(question._id) });
    const submissionWindowSeconds =
      Number.isFinite(question.durationSeconds) && question.durationSeconds > 0
        ? question.durationSeconds
        : 30;
    const questionStart = new Date(question.startTime);
    const submissionDeadlineMs = questionStart.getTime() + submissionWindowSeconds * 1000;
    if (!Number.isFinite(submissionDeadlineMs)) {
      return res.status(400).json({ message: "Active question has invalid timing metadata" });
    }
    let appliedCount = 0;
    let skippedLateCount = 0;

    for (let ans of answers) {
      const submittedTime = ans.submittedAt ? new Date(ans.submittedAt) : null;
      if (!submittedTime || submittedTime.getTime() > submissionDeadlineMs) {
        skippedLateCount += 1;
        continue;
      }

      const participant = await Participant.findOne({ teamId: ans.teamId });
      const tierData = tierConfig[ans.tier];
      if (!participant || !tierData) {
        continue;
      }

      if (ans.isCorrect) {
        participant.balance += ans.investmentAmount * tierData.profit;
      } else {
        participant.balance -= ans.investmentAmount * tierData.loss;
      }

      await participant.save();
      appliedCount += 1;
    }

    question.isActive = false;
    await question.save();

    await Participant.updateMany(
      { lastAnsweredQuestion: question._id },
      { $set: { currentInvestment: 0 } }
    );

    await GameState.findOneAndUpdate(
      { currentQuestion: question._id },
      { $set: { totalInvested: 0 } }
    );

    const leaderboard = await Participant.find().sort({ balance: -1 }).limit(5);

    res.json({
      message: "Answer revealed & balances updated",
      correctAnswer: question.correctAnswer,
      appliedCount,
      skippedLateCount,
      leaderboard
    });
    emitGameEvent("answer:revealed", {
      questionId: String(question._id),
      correctAnswer: question.correctAnswer,
      appliedCount,
      skippedLateCount
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Reveal failed" });
  }
};




const getDashboard = async (req, res) => {
  try {
    const gameState = await GameState.findOne().populate("currentQuestion");

    if (!gameState || !gameState.currentQuestion) {
      return res.status(200).json({
        success: true,
        currentQuestion: null,
        totalMoneyInvested: 0,
        top5Participants: [],
        rankedParticipants: [],
        participants: [],
        participant: req.participant ? {
          teamId: req.participant.teamId,
          balance: req.participant.balance,
          currentInvestment: req.participant.currentInvestment || 0
        } : null
      });
    }

    const currentQuestionId = gameState.currentQuestion._id;

    // participants who answered current question
    const participants = await Participant.find({
      lastAnsweredQuestion: currentQuestionId
    }).select("teamId balance currentInvestment");

    // total invested on current question
    const totalMoneyInvested = participants.reduce(
      (sum, p) => sum + (p.currentInvestment || 0),
      0
    );

    // top 5 by balance from current question participants
    const currentTop5Participants = await Participant.find({
      lastAnsweredQuestion: currentQuestionId
    })
      .sort({ balance: -1 })
      .limit(5)
      .select("teamId balance currentInvestment");

    // top 5 participants by balance
    const top5Participants = await Participant.find()
      .sort({ balance: -1 })
      .limit(5)
      .select("teamId balance");

    // full leaderboard sorted by balance (desc)
    const rankedParticipants = await Participant.find()
      .sort({ balance: -1 })
      .select("teamId balance currentInvestment");
    
    res.status(200).json({
      success: true,
      currentQuestion: gameState.currentQuestion,
      totalMoneyInvested,
      top5Participants,
      rankedParticipants,
      currentTop5Participants,
      participants,
      participant: req.participant ? {
        teamId: req.participant.teamId,
        balance: req.participant.balance,
        currentInvestment: req.participant.currentInvestment || 0
      } : null
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard"
    });
  }
};

// POST /api/game/reset  (Admin)
const resetGame = async (req, res) => {
  try {
    // Reset game state
    await GameState.findOneAndUpdate({}, {
      currentQuestion: null,
      totalInvested: 0,
      isActive: false
    });

    // Reset all participants
    await Participant.updateMany({}, {
      $set: {
        currentInvestment: 0,
        lastAnsweredQuestion: null
      }
    });

    res.status(200).json({
      success: true,
      message: "Game reset successfully"
    });
    emitGameEvent("game:reset", { success: true });
    
  } catch (error) {
    console.error("Reset Game Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset game"
    });
  }
};

// POST /api/admin/set-default-balance  (Admin)
const setDefaultBalance = async (req, res) => {
  try {
    const normalizedBalance = Number(req.body?.defaultBalance);
    if (!Number.isFinite(normalizedBalance) || normalizedBalance < 0) {
      return res.status(400).json({
        success: false,
        message: "defaultBalance must be a non-negative number"
      });
    }

    const onlineThreshold = new Date(Date.now() - ONLINE_WINDOW_SECONDS * 1000);

    const updateResult = await Participant.updateMany(
      { lastSeenAt: { $gte: onlineThreshold } },
      {
        $set: {
          balance: normalizedBalance,
          currentInvestment: 0
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "Default balance applied to online participants",
      matchedCount: updateResult.matchedCount || 0,
      modifiedCount: updateResult.modifiedCount || 0,
      defaultBalance: normalizedBalance,
      onlineWindowSeconds: ONLINE_WINDOW_SECONDS
    });
    emitGameEvent("balance:default-applied", {
      matchedCount: updateResult.matchedCount || 0,
      modifiedCount: updateResult.modifiedCount || 0,
      defaultBalance: normalizedBalance
    });
  } catch (error) {
    console.error("Set Default Balance Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set default balance"
    });
  }
};



// GET /api/game/current-question


const getCurrentQuestion = async (req, res) => {
  try {
    const question = await Question.findOne({ isActive: true });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "No active question"
      });
    }

    res.status(200).json({
      success: true,
      question
    });

  } catch (error) {
    console.error("Get Current Question Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch current question"
    });
  }
};

module.exports = {
  pushQuestionController,
  submitAnswerController,
  revealAnswerController,
  getDashboard,
  resetGame,
  getCurrentQuestion,
  setDefaultBalance
};




