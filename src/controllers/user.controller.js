import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { app } from "../app.js";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt"
import mongoose from "mongoose";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { upload } from "../middlewares/multer.middleware.js";

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, avatar, coverImage, fullName } = req.body;

    if (!username || !email || !password || !avatar || !coverImage || !fullName) {
        return res.status(400).json({
            message: "Please enter all data"
        })
    }

    const isUserExist = await User.findOne({ email })
    if (isUserExist) {
        return res.status(409).json({
            message: "User already exists."
        })
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
    const user = await User.create(data);

    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save()

    res.status(201).json({
        message: "User created Successfully",
        refreshToken: refreshToken
    })


})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email })

    if (!user) {
        return res.status(404).json({
            message: "User does not exist"
        })
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }
    console.log("User received: ", user)

    const responseData = {
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        coverImage: user.coverImage,
        fullName: user.fullName,
        watchHistory: user.watchHistory,
        refreshToken: user.refreshToken,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    }
    res.status(200).json({
        message: "Success",
        data: responseData
    })
})

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!id) {
        return res.status(400).json({
            message: "Provide id"
        })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid User ID format"
        })
    }

    const isUserExist = await User.findById(id)

    if (!isUserExist) {
        return res.status(404).json({
            message: "User does not exist"
        })
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
        return res.status(400).json({
            message: "Provide User ID"
        })
    }
    if (!username && !email && !password && !avatar && !coverImage && !fullName) {
        return res.status(400).json({
            message: "Provide any field to update"
        });
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
        return res.status(400).json({
            message: "User ID is not in valid format"
        })
    }

    const updatedUser = await User.findByIdAndUpdate(id, fieldsToBeUpdated, { new: true })

    if (!updatedUser) {
        return res.status(404).json({
            message: "User does not exist with this ID"
        })
    }

    res.status(200).json({
        message: "User updated successfully",
        data: updatedUser
    })
})

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-refreshToken -createdAt -updatedAt")
    res.status(200).json({
        message: "Success",
        data: users
    })
})

const updateWatchHistory = asyncHandler(async (req, res) => {
    const { id, videoId } = req.body;

    if (!id || !videoId) {
        return res.status(400).json({
            message: "Provide all fields"
        })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "User ID is not in valid format"
        })
    }


    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json({
            message: "Video ID is not in valid format"
        })
    }
    const user = await User.findOne({ _id: id })

    user.watchHistory.push(videoId)

    await user.save()

    res.status(200).json({
        message: "Added video to watchHistory"
    })

})

const getWatchHistoryVideos = asyncHandler( async (req,res)=>{

    const {userId} = req.params;

    if(!mongoose.Types.ObjectId.isValid(userId)){
        return res.status(400).json({
            message: "User ID is not in valid format"
        })
    }

    const watchHistory = await User.aggregate([
        {
            $match: {_id: userId.toString() }
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
            $project:{
                _id: 1,
                videoDetails: 1
            }
        }
    ])

    console.log("Videos Received: ",watchHistory);

    res.status(200).json({
        message: "success",
        data: watchHistory
    })
    
} )

export { registerUser, loginUser, deleteUser, updateUser, getAllUsers, updateWatchHistory, getWatchHistoryVideos};