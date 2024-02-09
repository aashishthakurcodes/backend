import mongoose from "mongoose";
 import { DB_Name } from "../constant.js";

 const connectDB=async()=>{
    try {
        
      const connectionResponse=  await mongoose.connect(`${process.env.MONGO_URL}/${DB_Name}`)
      console.log(`\n MongoDb connection successfully at  ${connectionResponse.connection.host}`)
    } catch (error) {
       console.log("Mongo DB connection Error ",error);
       process.exit(1) 
    }
 }

 export default connectDB;


