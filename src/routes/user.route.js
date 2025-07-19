import { Router } from "express";
import {registerUser,loginUser,deleteUser, updateUser, getAllUsers, getWatchHistoryVideos, updateWatchHistory} from "../controllers/user.controller.js";


const userRouter = Router();

userRouter.route("/register").post(registerUser)

userRouter.route("/login").post(loginUser)

userRouter.route("/delete/:id").delete(deleteUser)

userRouter.route("/update").patch(updateUser)

userRouter.route("/getAllUsers").get(getAllUsers)

userRouter.route("/getWatchHistoryVideos/:userId").get(getWatchHistoryVideos)

userRouter.route("/updateWatchHistory").patch(updateWatchHistory)

export default userRouter