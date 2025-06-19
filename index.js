require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const connectDB= require('./config/db')
const documentRoute = require('./routes/documentRoute');

const port = 3000;

const app = express();
app.use(express.json());

connectDB();

app.use("/api/documents", documentRoute);


app.listen(port, ()=>{
  console.log(`server is running now on port ${port}`);
})