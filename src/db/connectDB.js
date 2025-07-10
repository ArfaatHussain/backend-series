import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"
import { app } from "../app.js"

async function connectDB(){
    try {
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.info(`MongoDB connected!! DB HOST: ${connectionInstance.connection.host}`)
        app.on("error",(error)=>{
            console.error("Error detected by listener: "+error)
        })
    } catch (error) {
        console.error("Error: "+error)
        process.exit(1)
    }
}

export default connectDB;