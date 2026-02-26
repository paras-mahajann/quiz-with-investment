const mongoose = require('mongoose')

const participantSchema = new mongoose.Schema({
    teamId:{
        type:String,
        unique:[true,"you cannot make team with this team id"]
    },
    password:String,
    balance:Number,
})

const participantModel = mongoose.model('Participant',participantSchema);

module.exports = participantModel;