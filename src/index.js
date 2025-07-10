import express from 'express'
import  connectDB  from './db/connectDB.js';
import dotenv from "dotenv";

dotenv.config({
    path:'./env'
})
const app = express();

connectDB();
app.listen(process.env.PORT,()=>{
    console.info("Server is running on "+process.env.PORT)
})
