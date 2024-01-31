import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDNARY_NAME,
  api_key: process.env.CLOUDNARY_API_KEY,
  api_secret: process.env.CLOUDNARY_API_SECRET_KEY,
});

const uploadOnCloudnary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //Upload on cloud
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //File uploaded successfully
    console.log("File Upload Successfully");
    console.log(response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // Locally Save Temperary file
    return null;
  }
};

export { uploadOnCloudnary };
