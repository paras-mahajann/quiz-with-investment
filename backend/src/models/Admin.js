const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
    adminId:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    }
});

const adminModel = mongoose.model('Admin',adminSchema);

module.exports = adminModel;