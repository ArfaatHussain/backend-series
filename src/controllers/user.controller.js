import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { app } from "../app.js";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt"
import mongoose from "mongoose";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { upload } from "../middlewares/multer.middleware.js";
import { ApiError } from "../utils/ApiError.js";

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, avatar, coverImage, fullName } = req.body;

    if (!username || !email || !password || !avatar || !coverImage || !fullName) {
        throw new ApiError(400, "Enter all data")
    }

    const isUserExist = await User.findOne({ email })
    if (isUserExist) {
        throw new ApiError(409, "User already exists")
    }
    console.log("Password Before Hashing: ", password);

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Password after hashing: ", hashedPassword)

    // upload
    const avatarResponse = await uploadFileOnCloudinary(avatar)
    const coverImageResponse = await uploadFileOnCloudinary(coverImage)
    const data = {
        username,
        email,
        password: hashedPassword,
        avatar: avatarResponse.url,
        coverImage: coverImageResponse.url,
        fullName
    }
    await User.create(data);

    res.status(201).json({
        message: "User created Successfully",
    })

})


const generateAccessTokenAndRefreshToken = async (user) => {
    try {
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken
        await user.save()

        return { accessToken, refreshToken }
    } catch (error) {
        console.error("Something went wrong while generating Access and Refresh Tokens: ",error)
    }
}
const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
        throw new ApiError(400, "Send data in json format")
    }

    if (!username && !email) {
        throw new ApiError(400, "Provide username or email")
    }
    if (!password) {
        throw new ApiError(400, "Provide password")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password")
    }
    console.log("User received: ", user)

    const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user)
    const responseData = {
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        coverImage: user.coverImage,
        fullName: user.fullName,
        watchHistory: user.watchHistory,
        refreshToken: refreshToken,
        accessToken: accessToken,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    }
    const options = {
        httponly: true,
        secure: true
    }
    res.status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",refreshToken,options)
    .json({
        message: "Success",
        data: responseData
    })
})

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!id) {
        throw new ApiError(400, "Provide id")
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid User ID format")
    }

    const isUserExist = await User.findById(id)

    if (!isUserExist) {
        throw new ApiError(404, "User does not exist")
    }

    await User.deleteOne({ _id: id })
    res.status(200).json({
        message: "User deleted"
    })

})

const updateUser = asyncHandler(async (req, res) => {
    const fieldsToBeUpdated = {}

    const { id, username, email, password, avatar, coverImage, fullName } = req.body;

    if (!id) {
        throw new ApiError(400, "Provide User ID")
    }
    if (!username && !email && !password && !avatar && !coverImage && !fullName) {
        throw new ApiError(400, "Provide any field to update")
    }
    if (username) {
        fieldsToBeUpdated.username = username
    }
    if (email) {
        fieldsToBeUpdated.email = email
    }
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10)
        fieldsToBeUpdated.password = hashedPassword
    }
    if (fullName) {
        fieldsToBeUpdated.fullName = fullName
    }

    if (avatar) {
        console.info("Uploading avatar to cloudinary")
        const avatarResponse = await uploadFileOnCloudinary(avatar)
        fieldsToBeUpdated.avatar = avatarResponse.url
        console.info("Got URL for Avatar")
    }

    if (coverImage) {
        console.info("Uploading Cover Image to cloudinary")
        const coverImageResponse = await uploadFileOnCloudinary(coverImage)
        fieldsToBeUpdated.coverImage = coverImageResponse.url
        console.info("Got URL for Cover Image")
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "User ID is not in valid format")
    }

    const updatedUser = await User.findByIdAndUpdate(id, fieldsToBeUpdated, { new: true })

    if (!updatedUser) {
        throw new ApiError(404, "User does not exist with this ID")
    }

    res.status(200).json({
        message: "User updated successfully",
        data: updatedUser
    })
})

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-createdAt -updatedAt")
    res.status(200).json({
        message: "Success",
        data: users
    })
})

const updateWatchHistory = asyncHandler(async (req, res) => {
    const { id, videoId } = req.body;

    if (!id || !videoId) {
        throw new ApiError(400, "Provide all fields")
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "User ID is not in valid format")
    }


    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Video ID is not in valid format")
    }
    const user = await User.findOne({ _id: id })

    user.watchHistory.push(videoId)

    await user.save()

    res.status(200).json({
        message: "Added video to watchHistory"
    })

})

const getWatchHistoryVideos = asyncHandler(async (req, res) => {

    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "User ID is not in valid format")
    }

    const watchHistory = await User.aggregate([
        {
            $match: { _id: userId.toString() }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $project: {
                _id: 1,
                videoDetails: 1
            }
        }
    ])

    console.log("Videos Received: ", watchHistory);

    res.status(200).json({
        message: "success",
        data: watchHistory
    })

})

const logoutUser = asyncHandler( async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,{
        $set:{
            refreshToken: undefined
        }
    })

    const options = {
        httponly: true,
        secure: true
    }
    res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({
        message: "Logout Successfully"
    })
} )

export { registerUser, loginUser, deleteUser, updateUser, getAllUsers, updateWatchHistory, getWatchHistoryVideos, logoutUser };