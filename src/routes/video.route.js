import { Router } from "express";
import { getVideos, upload, changePublishStatus } from "../controllers/video.controller.js";

const videoRouter = Router()

videoRouter.route("/upload").post(upload)

videoRouter.route("/getVideos").get(getVideos)

videoRouter.route("/changePublishStatus").patch(changePublishStatus)

export {videoRouter}