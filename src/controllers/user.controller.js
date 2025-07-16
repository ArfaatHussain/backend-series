import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { app } from "../app.js";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt"

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

    const data = {
        username,
        email,
        password: hashedPassword,
        avatar,
        coverImage,
        fullName
    }
    const user = await User.create(data);


    res.status(201).json({
        message: "User created Successfully",
        // data: responseData
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
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    }
    res.status(200).json({
        message: "Success",
        data: responseData
    })
})

export { registerUser, loginUser };