const mongoose  = require('mongoose')

async function connectToDB(){
    await mongoose.connect(process.env.MONGO_URI);
    console.log("connected to mongoDB");    
}

module.exports = connectToDB;