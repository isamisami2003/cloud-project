require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const connectDB= require('./config/db')
const documentRoute = require('./routes/documentRoute');
const path = require('path');


const port = 3000;

const app = express();
app.use(express.json());

connectDB();

app.use("/api/documents", documentRoute);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(port, ()=>{
  console.log(`server is running now on port ${port}`);
})
