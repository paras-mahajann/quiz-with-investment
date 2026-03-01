const mongoose = require('mongoose')

const GameStateSchema = new mongoose.Schema({
    currentQuestion: {type:mongoose.Schema.Types.ObjectId,ref:"Question"},
    totalInvested: Number
});


const GameStateModel = mongoose.model('GameState',GameStateSchema);

module.exports = GameStateModel;