const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question:{
        type:String,
        required:true
    },
    questionId:String,
    ans:{
        type:String,
        required:true
    },
    difficulty:String

});

const questionModel = mongoose.model('questions',questionSchema);

module.exports = questionModel;