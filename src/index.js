import {app} from './app.js'
import  connectDB  from './db/connectDB.js';
import dotenv from "dotenv";
import { ApiError } from './utils/ApiError.js';
dotenv.config({
    path:'./env'
})

connectDB();

app.get("/error",(req,res,next)=>{
    try {
        throw new ApiError(400,"Invalid Input",["Field 'email' is required"])
    } catch (error) {
        next(error)
    }
})
app.listen(process.env.PORT,()=>{
    console.info("Server is running on "+process.env.PORT)
})
