const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
    Id:String,
    password:String
})

const adminModel = mongoose.model('Admin',adminSchema);

module.exports = adminModel;