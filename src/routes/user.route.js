import { Router } from "express";
import {registerUser,loginUser,deleteUser} from "../controllers/user.controller.js";


const userRouter = Router();

userRouter.route("/register").post(registerUser)

userRouter.route("/login").post(loginUser)

userRouter.route("/delete/:id").delete(deleteUser)


export default userRouter