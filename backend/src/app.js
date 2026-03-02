const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors');


const participantRoutes = require('./routes/participantRoutes')
const authRoutes = require('./routes/authRoutes')
const adminRoutes = require('./routes/adminRoutes')


const app = express();

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (Postman, mobile apps)
    if (!origin) return callback(null, true);

    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());



app.use('/api/auth',authRoutes);
app.use('/api/participant',participantRoutes);
app.use('/api/admin',adminRoutes);

app.use('/',(req,res)=>{
    res.send('Quiz Investment Backend is running...')
});







module.exports = app;
