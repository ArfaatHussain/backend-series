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

const getAllVideos = asyncHandler(async (req, res) => {

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

const likeVideo = asyncHandler(async (req, res) => {
    const { userId, videoId } = req.body;

    if (!userId || !videoId) {
        throw new ApiError(400, "User ID or Video ID is missing")
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "User ID or Video ID is not in correct format")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"Video not found")
    }

    const isUserAlreadyLiked = video.likedBy.some(item => item.toString() === userId.toString());

    if (isUserAlreadyLiked) {
        throw new ApiError(409, "User already liked this video")
    }

    video.likes = +1

    video.likedBy?.push(userId)

    await video.save()

    res.status(201).json({
        message: "success"
    })
})

const getVideo = asyncHandler( async(req,res)=>{
    const {videoId} = req.params

    if(!videoId){
        throw new ApiError(400,"Video ID is missing")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"Video not found")
    }

    res.status(200).json({
        message: "success",
        data: video
    })
} )

const addView = asyncHandler( async(req,res)=>{
     const { userId, videoId } = req.body;

    if (!userId || !videoId) {
        throw new ApiError(400, "User ID or Video ID is missing")
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "User ID or Video ID is not in correct format")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"Video not found")
    }

    const isUserAlreadyLiked = video.viewedBy?.some(item => item.toString() === userId.toString());

    if (isUserAlreadyLiked) {
        throw new ApiError(409, "User already viewed this video")
    }

    video.views = +1

    video.viewedBy?.push(userId)

    await video.save()

    res.status(201).json({
        message: "success"
    })
} )


export { upload, getAllVideos, changePublishStatus, likeVideo, getVideo, addView }