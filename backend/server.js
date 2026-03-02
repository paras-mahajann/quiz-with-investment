require('dotenv').config()
const app = require('./src/app');
const connectToDB = require('./src/config/database');
const http = require("http");
const { initSocket } = require("./src/socket");

connectToDB();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
initSocket(server);

server.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT} `);    
})
