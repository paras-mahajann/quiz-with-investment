const Question = require("../models/Question");
const { emitGameEvent } = require("../socket");

const addQuestionController = async (req, res) => {
  try {
    let { questionId, question, options, correctAnswer, difficulty, durationSeconds } = req.body;


    if (!question || !Array.isArray(options) || options.length === 0 || !correctAnswer) {
      return res.status(400).json({
        message: "question, options (non-empty array), and correctAnswer are required"
      });
    }

    if (!options.includes(correctAnswer)) {
      return res.status(400).json({
        message: "correctAnswer must be one of the options"
      });
    }

    const normalizedDuration = Number(durationSeconds ?? 30);
    if (!Number.isFinite(normalizedDuration) || normalizedDuration <= 0) {
      return res.status(400).json({
        message: "durationSeconds must be a positive number"
      });
    }

    if (!questionId) {
      const numericQuestions = await Question.find({
        questionId: { $regex: "^[0-9]+$" }
      }).select("questionId");

      const maxNumericId = numericQuestions.reduce((max, item) => {
        const value = Number(item.questionId);
        return Number.isNaN(value) ? max : Math.max(max, value);
      }, 0);

      questionId = String(maxNumericId + 1);
    }

    const duplicate = await Question.findOne({ questionId: String(questionId) });
    if (duplicate) {
      return res.status(409).json({
        message: "Question with this questionId already exists"
      });
    }

    const newQuestion = await Question.create({
      questionId: String(questionId),
      question,
      options,
      correctAnswer,
      difficulty,
      durationSeconds: Math.floor(normalizedDuration)
    });

    res.status(201).json({
      message: "Question added successfully",
      question: newQuestion
    });
    emitGameEvent("question:added", {
      questionId: String(newQuestion._id),
      displayQuestionId: newQuestion.questionId
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getQuestionsController = async (req, res) => {
  try {
    const questions = await Question.find();

    res.status(200).json({
      total: questions.length,
      questions
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addQuestionController,
  getQuestionsController
};
