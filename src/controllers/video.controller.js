import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { app } from "../app.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

const upload = asyncHandler(async (req, res) => {

    if (!req.body || Object.keys(req.body).length === 0) {
        throw new ApiError(400, "Request body is missing")
    }

    const { videoFile, thumbnail, title,
        owner, description, duration } = req.body

    if (!videoFile || !thumbnail || !title || !owner || !description || !duration) {
        throw new ApiError(400, "Please provide all fields")
    }

    if (!mongoose.Types.ObjectId.isValid(owner)) {
        throw new ApiError(400, "User id is not in valid format")
    }

    const isUserExist = await User.findById(owner)
    if (!isUserExist) {
        throw new ApiError(400, "User does not exist")
    }

    console.log("Uploading video to cloudinary...");

    const videoFileResponse = await uploadFileOnCloudinary(videoFile);

    console.log("Success: Video Uploaded")

    await Video.create({
        videoFile: videoFileResponse.url,
        thumbnail,
        title,
        owner,
        description,
        duration
    })

    res.status(201).json({
        message: "Video uploaded successfully."
    })
})

const getVideos = asyncHandler(async (req, res) => {

    const videos = await Video.find({ isPublished: true })

    if (!videos || videos.length === 0) {
        throw new ApiError(404, "No videos yet")
    }


    res.status(200).json({
        message: "success",
        data: videos
    })
})

const changePublishStatus = asyncHandler(async (req, res) => {

    if (!req.body || Object.keys(req.body).length === 0) {
        throw new ApiError(400, "Request body is missing")
    }

    const { videoId, owner, status } = req.body;

    if (!videoId || !owner || status === undefined) {
        throw new ApiError(400, "Please provide all fields")
    }

    if (!mongoose.Types.ObjectId.isValid(owner)) {
        throw new ApiError(400, "User id is not in correct format")
    }

    if (typeof status !== "boolean") {
        throw new ApiError(400, "status must be boolean")
    }

    const video = await Video.findById(videoId);

    if (video.owner.toString() !== owner.toString()) {
        throw new ApiError(401, "Owner ID did not match")
    }

    await Video.updateOne({ _id: videoId }, {
        $set: { isPublished: status }
    })

    res.status(200).json({
        message: "Publish status updated."
    })

})



export { upload, getVideos, changePublishStatus }