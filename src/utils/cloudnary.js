import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        // upload files on cloudinary

        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto",

        })
        //  file uploaded successfull
        // console.log("uploded file url", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (localFilePath) {

    fs.unlinkSync(localFilePath) // remove file on local disk when file not  uploade
    }
}


export {uploadOnCloudinary}