require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("../src/models/Question");

const dummyQuestions = [
  {
    questionId: "1",
    question: "What does SIP stand for in investing?",
    options: ["Systematic Investment Plan", "Secure Income Program", "Stock Index Pricing", "Simple Interest Plan"],
    correctAnswer: "Systematic Investment Plan",
    difficulty: "easy"
  },
  {
    questionId: "2",
    question: "Which asset is generally considered safest?",
    options: ["Government bonds", "Penny stocks", "Crypto memecoins", "Options contracts"],
    correctAnswer: "Government bonds",
    difficulty: "easy"
  },
  {
    questionId: "3",
    question: "What is diversification?",
    options: ["Putting all money in one stock", "Spreading investments across assets", "Timing market tops", "Avoiding all risk"],
    correctAnswer: "Spreading investments across assets",
    difficulty: "easy"
  },
  {
    questionId: "4",
    question: "If inflation rises, purchasing power usually...",
    options: ["Increases", "Stays constant", "Decreases", "Doubles"],
    correctAnswer: "Decreases",
    difficulty: "medium"
  },
  {
    questionId: "5",
    question: "P/E ratio compares price to...",
    options: ["Book value", "Earnings", "Dividend", "Cash flow only"],
    correctAnswer: "Earnings",
    difficulty: "medium"
  },
  {
    questionId: "6",
    question: "Compounding works best with...",
    options: ["Short holding periods", "Frequent withdrawals", "Time and reinvestment", "No returns"],
    correctAnswer: "Time and reinvestment",
    difficulty: "easy"
  },
  {
    questionId: "7",
    question: "A bull market typically means...",
    options: ["Prices are generally rising", "Prices are frozen", "Prices are crashing", "No trading happens"],
    correctAnswer: "Prices are generally rising",
    difficulty: "easy"
  },
  {
    questionId: "8",
    question: "What does liquidity mean?",
    options: ["How quickly an asset can be sold", "How much return it gives", "Its tax rate", "Its dividend policy"],
    correctAnswer: "How quickly an asset can be sold",
    difficulty: "medium"
  },
  {
    questionId: "9",
    question: "High risk investments usually offer...",
    options: ["Guaranteed returns", "Lower potential return", "Higher potential return", "No volatility"],
    correctAnswer: "Higher potential return",
    difficulty: "medium"
  },
  {
    questionId: "10",
    question: "Index funds are designed to...",
    options: ["Beat every stock daily", "Track a market index", "Avoid equities entirely", "Eliminate all risk"],
    correctAnswer: "Track a market index",
    difficulty: "easy"
  }
];

async function seedQuestions() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in .env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  await Question.deleteMany({});
  await Question.insertMany(dummyQuestions);
  console.log(`Inserted ${dummyQuestions.length} dummy questions`);
  await mongoose.disconnect();
}

seedQuestions()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error("Seed failed:", err.message);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  });
