const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors');
const { corsOptions } = require('./config/corsOptions');


const participantRoutes = require('./routes/participantRoutes')
const authRoutes = require('./routes/authRoutes')
const adminRoutes = require('./routes/adminRoutes')


const app = express();

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());



app.use('/api/auth',authRoutes);
app.use('/api/participant',participantRoutes);
app.use('/api/admin',adminRoutes);

app.use('/',(req,res)=>{
    res.send('Quiz Investment Backend is running...')
});







module.exports = app;
