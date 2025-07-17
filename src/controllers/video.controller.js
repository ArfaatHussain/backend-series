import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { app } from "../app.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";

const upload = asyncHandler(async (req, res) => {

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            message: "Request body is missing"
        })
    }

    const { videoFile, thumbnail, title,
        owner, description, duration } = req.body

    if (!videoFile || !thumbnail || !title || !owner || !description || !duration) {
        return res.status(400).json({
            message: "Please provide all fields"
        })
    }

    if (!mongoose.Types.ObjectId.isValid(owner)) {
        return res.status(400).json({
            message: "User id is not in valid format"
        })
    }

    const isUserExist = await User.findById(owner)
    if (!isUserExist) {
        return res.status(404).json({
            message: "User does not exist"
        })
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

    const videos = await Video.find()

    const publishedVideos = videos.filter((item) => item.isPublished === true)
    if (!publishedVideos || publishedVideos.length === 0) {
        return res.status(404).json({
            message: "No videos yet"
        })
    }


    res.status(200).json({
        message: "success",
        data: publishedVideos
    })
})

const changePublishStatus = asyncHandler(async (req, res) => {

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            message: "Request body is missing"
        })
    }

    const { videoId, owner, status } = req.body;

    if (!videoId || !owner || status===undefined) {
        return res.status(400).json({
            message: "Please provide all fields"
        })
    }

    if (!mongoose.Types.ObjectId.isValid(owner)) {
        return res.status(400).json({
            message: "User id is not in correct format"
        })
    }

    if (typeof status !== "boolean") {
        return res.status(400).json({
            message: "status must be boolean"
        })
    }

    const video = await Video.findById(videoId);

    // console.log("Owner id: ",video.owner);
    

    if (video.owner.toString() !== owner.toString()) {
        return res.status(401).json({
            message: "Owner id did not match"
        })
    }

    await Video.updateOne({ _id: videoId }, {
        $set: { isPublished: status }
    })

    res.status(200).json({
        message: "Publish status updated."
    })

})

export { upload, getVideos, changePublishStatus }