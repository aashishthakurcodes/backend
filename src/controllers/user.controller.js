import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.Model.js";
import { uploadOnCloudnary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
  console.log("E-mail", email);
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  // Checking Esist Username or email
  const existUser = User.findOne({
    $or: [{ username }, { email }],
  });

  if (existUser) {
    throw new ApiError(409, "User Already Exist");
  }

  // Checking images
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImgLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  //Upload on cloudary
  const avatar = await uploadOnCloudnary(avatarLocalPath);
  const coverImage = await uploadOnCloudnary(coverImgLocalPath);

  //Checking Avatar
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  // Saving on Dtabase
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

export { registerUser };
