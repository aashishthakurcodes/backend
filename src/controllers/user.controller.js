import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import { User } from "../models/user.Model.js";

const registerUser = asyncHandler(async (req,res)=>{
    // Get user detail from frontend all users model
    // Validation - not empty
    // Existence of user via email or username
    // Check for images and avatar 
    // Upload on cloud , avatar checking
    // Making user object and create entry in db
    // Remove Password and refresh token from response
    // Check for user creation
    // Return res
    
    const { fullname,email,username,password}=req.body;
    console.log("E-mail",email);
    if([fullname,email,username,password].some((field)=>field?.trim() === ""))
    {
        throw new ApiError(400,"All fields are required")
    }
   // Checking Esist Username or email
    const existUser = User.findOne({
        $or: [{username},{email}]
    })

    if(existUser){
        throw new ApiError(409,"User Already Exist")
    }
    
    

})

const loginUser = asyncHandler(async (req,res)=>{
    res.status(200).json({
        message:"Login Succesfully"
    })
})


export {registerUser,loginUser}