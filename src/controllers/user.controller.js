import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.Model.js";
import { uploadOnCloudnary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateacessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating and refresh Token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // Get user detail from frontend all users model
  // Validation - not empty
  // Existence of user via email or username
  // Check for images and avatar
  // Upload on cloud , avatar checking
  // Making user object and create entry in db
  // Remove Password and refresh token from response
  // Check for user creation
  // Return res

  const { fullname, email, username, password } = req.body;
  // console.log("E-mail", email);
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  //Checking E-mail
  if (!email.includes("@gmail.com")) {
    throw new ApiError(400, "Enter a valid E-Mail");
  }
  // Checking Esist Username or email
  const existUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existUser) {
    throw new ApiError(409, "User Already Exist");
  }

  console.log("request Error", req.files);
  // Checking images

  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0]?.path;
  }
  let coverImgLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImgLocalPath = req.files.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  //Upload on cloudary
  const avatar = await uploadOnCloudnary(avatarLocalPath);
  const coverImage = await uploadOnCloudnary(coverImgLocalPath);

  //Checking Avatar
  if (!avatar) {
    throw new ApiError(400, "Avatar is required true");
  }

  // Saving on Database
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  //Checking User and removing password and refreshToken
  const createdUser = await User.findById(user._id).select(
    "-password -refershTokens"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something Went Wrong while Registration");
  }

  //Sending Response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // Data from form
  // Username
  // Find the user
  // Passpord check
  // Acess or refresh token
  // Send Cookies
  // Send Login msg

  const { email, username, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "Username or E-mail is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Ckecking password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid User Credentials");
  }

  const { accessToken, refreshToken } = await generateacessAndRefreshToken(
    user._id
  );

  const loginUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loginUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully"
      )
    );
});
//LOgout User

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refesh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } = await generateacessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh Token _01");
  }
});
//Change Current Password
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});
//Get Current User info
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "Current User Fetched Successfully");
});
//Update Account Details
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user =await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Updated Successfully"));
});
//Update Avatar Image
const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is missing");
  }
  const avatar = await uploadOnCloudnary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  const user=await User.findByIdAndUpdate(
    req.user?._id,
    { $set: avatar.url },
    { new: true }.select("-password")
  );
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image is updated"));
});
//Update Cover Image
const updateCoverImg = asyncHandler(async (req, res) => {
  const coverImgLocalPath = req.file?.path;
  if (!coverImgLocalPath) {
    throw new ApiError(400, "coverImg is missing");
  }
  const coverImage = await uploadOnCloudnary(coverImgLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on cover Image");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: coverImage.url },
    { new: true }.select("-password")
  );
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image is updated"));
});

//Getting Userprofile
const getUserProfile=asyncHandler(async(req,res)=>{
  const {username}=req.params
  if(!username?.trim()){
    throw new ApiError(400,"Username is missing")
  }
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImg
};
