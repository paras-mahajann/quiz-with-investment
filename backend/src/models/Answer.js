const mongoose = require('mongoose')


const answersSchema = new mongoose.Schema({
    teamId:String,
    questionId:String,
    selectedOption:String,
    tier:Number,
    investmentAmount:Number,
    isCorrect:Boolean,
    submittedAt: { type: Date, default: Date.now }
});

// Prevent duplicate submissions for the same team on the same question.
answersSchema.index({ teamId: 1, questionId: 1 }, { unique: true });

const answersModel = mongoose.model('Answers',answersSchema);

module.exports = answersModel;


