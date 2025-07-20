import express from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))


app.use(express.json())

// parse url-encoded data from request
app.use(express.urlencoded())

// helps to store files,images 
app.use(express.static("public"))

// Helps to perform CRUD operations to Cookies
app.use(cookieParser())



import userRouter from "./routes/user.route.js";
import { videoRouter } from "./routes/video.route.js";


app.use("/users",userRouter)

app.use("/video", videoRouter)

export {app}