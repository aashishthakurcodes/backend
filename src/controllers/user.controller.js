import {asyncHandler} from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req,res)=>{
    res.status(200).json({
        message:"ok"
    })
})

const loginUser = asyncHandler(async (req,res)=>{
    res.status(200).json({
        message:"Login Succesfully"
    })
})


export {registerUser,loginUser}