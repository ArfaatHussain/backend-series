import { Router } from "express";
import {registerUser,loginUser,deleteUser, updateUser, getAllUsers, getWatchHistoryVideos, updateWatchHistory, logoutUser, refreshAccessToken} from "../controllers/user.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";


const userRouter = Router();

userRouter.route("/register").post(registerUser)

userRouter.route("/login").post(loginUser)

userRouter.route("/delete/:id").delete(deleteUser)

userRouter.route("/update").patch(updateUser)

userRouter.route("/getAllUsers").get(getAllUsers)

userRouter.route("/getWatchHistoryVideos/:userId").get(getWatchHistoryVideos)

userRouter.route("/updateWatchHistory").patch(updateWatchHistory)

userRouter.route("/logout").post(verifyJWT, logoutUser)

userRouter.route("/refreshAccessToken").post(refreshAccessToken)

export default userRouter