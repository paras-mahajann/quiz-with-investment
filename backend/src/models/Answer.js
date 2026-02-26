const mongoose = require('mongoose')


const answersSchema = new mongoose.Schema({
    team_id:String,
    questionId:String,
    selectedOption:String,
    tier:Number,
    investmentAmount:Number,
    isCorrect:Boolean
});

const answersModel = mongoose.model('Answers',answersSchema);

module.exports = answersModel;