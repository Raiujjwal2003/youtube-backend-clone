import {asyncHandler} from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js"
import {uploadOnCloudinary} from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


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

    console.log(req.files)
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

export {registerUser}

