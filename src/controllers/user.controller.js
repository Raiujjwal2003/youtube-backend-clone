import {asyncHandler} from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js"
import {uploadOnCloudinary} from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { Aggregate } from "mongoose";
// import { verifyJWT } from "../middlewares/auth.middleware.js";


const generateAccessAndRefereshTokens = async(userId) => {
    try {

        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await  user.save({validateBeforeSave: false})

        return {
            accessToken,
            refreshToken
        }

    } catch (error) {
        throw new ApiError (500, "SOmthing went wrong when generating access and refresh token")

        
    }
}

const registerUser = asyncHandler (async (req, res) => {

    // get user details form frontend
    // validation - not empty
    // check if user already exists : username, email
    // check for image, CHECK  for avatar 
    // upload them to cloudnary , avatar
    // creat userobject = create entry in db
    // remove password and refresh token field form respons
    // check for user creation
    // return res

    const {fullName, email, username, password} = req.body
    console.log("email: ", email);

    if(fullName  == ""){
        throw new ApiError(400, "fullName is required")
    }

    if (
        [fullName, email , username , password].some((field)=> field?.trim() === "")

    ) {
        throw new ApiError(400, "All field is required")
    }

    const existedUser= await User.findOne({
        $or : [{ username },{ email }]
    })

    if(existedUser){
        throw  new ApiError (409, "User with email or username already exists")
    }

    // console.log(req.files)
    const avatarLocalPath=  req.files?.avatar[0]?.path ;
    // const coverImageLocalPath=  req.files?.coverImage[0]?.path ;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar is required")
    }

    const avatar = await  uploadOnCloudinary(avatarLocalPath)
    const coverImage = await  uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "avatar file is required")
    }

    const user = await User.create({
        fullName,
        email,
        password,
        avatar: avatar.url,
        coverImage : coverImage?.url || "",
        username: username.toLowerCase()
    })

    const userCreate= await User.findById(user._id)
    .select("-password -refreshToken")

    if(!userCreate){
        throw new ApiError(500, " Somthimg went wrong")
    }

    return res.status(201).json(
        new ApiResponse(200, userCreate ," User registered sucessfully")
    )

})

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

    

const logoutUser = asyncHandler(async(req, res) => {3
       User.findByIdAndUpdate( 
         req.user._id,
         {
            $set:{
                refreshToken:undefined
            },
         },
         {
            new:true
         }

       )
       const options ={
        httpOnly : true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})
 

const refreshAccessToken = asyncHandler(async (req, res) => {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
        if (!incomingRefreshToken) {
            throw new ApiError(401, "unauthorized request")
        }
    
        try {
            const decodedToken = jwt.verify(
                incomingRefreshToken,
                process.env.REFRESH_TOKEN_SECRET
            )
        
            const user = await User.findById(decodedToken?._id)
        
            if (!user) {
                throw new ApiError(401, "Invalid refresh token")
            }
        
            if (incomingRefreshToken !== user?.refreshToken) {
                throw new ApiError(401, "Refresh token is expired or used")
                
            }
        
            const options = {
                httpOnly: true,
                secure: true
            }
        
            const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
        
            return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200, 
                    {accessToken, refreshToken: newRefreshToken},
                    "Access token refreshed"
                )
            )
        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid refresh token")
        }
    
})

const changeCurrentPassword = asyncHandler(async( req, res) => {
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)  
    const isPasswordCorrect= await user.isPasswordCorrect(oldPassword) 

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old Password")

    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

return res
.status(200)
.json(new ApiResponse(200), {},"Password Change Sucessfully")
})

const getCurrentUser = asyncHandler(async(req, res ) => {
    return res 
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User Export Sucessfully"))
})

const  updateAccountDetails = asyncHandler (async (req, res) => {
    cosnt(fullName, email) = req.body
    if(!fullName || !email){
        throw new ApiError (400, "All fields are required")


    }
     const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {new: true}

        ).select("-password")

        return res
        .status(200)
        .json(new ApiRespons(200, user, "Account Details Updated"))

})

const updateUserAvatar = asyncHandler(async(req,req)=> {
    const avatarLocalPath= req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400," Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw(400, " Error While uploading avatar")

    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(200, user,"avatar updated Successfully")
})

const updateUserCoverImage = asyncHandler(async(req,req)=> {
    const coverImageLocalPath= req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400," coverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw(400, " Error While uploading coverImage")

    }

    const User=  await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(200, user,"coverImage updated Successfully")
})

const getUserChannelProfile = asyncHandler(async(req, res) =>{
    const {username} = req.params

    if(!username?.trim){
        throw new ApiError(400, "username is missing ")
    }

    const channel=  await User.Aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscription",
                localField:"_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from:"subscription",
                localField:"_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscibedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in :[req.user?._id, "$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscibedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1,
                createdAt:1


            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel doesnt exist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel fetched successfully"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile

}

