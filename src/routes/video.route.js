import { Router } from "express";
import { getAllVideos, upload, changePublishStatus, likeVideo , getVideo, addView} from "../controllers/video.controller.js";

const videoRouter = Router()

videoRouter.route("/upload").post(upload)

videoRouter.route("/getAllVideos").get(getAllVideos)

videoRouter.route("/changePublishStatus").patch(changePublishStatus)

videoRouter.route("/likeVideo").post(likeVideo)

videoRouter.route("/getVideo/:videoId").get(getVideo)

videoRouter.route("/addView").post(addView)


export {videoRouter}