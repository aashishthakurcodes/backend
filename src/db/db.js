import mongoose from "mongoose";
 import { DB_Name } from "../constant.js";

 const connectDB=async()=>{
    try {
        console.log(process.env.MONGO_URL)
      const connectionResponse=  await mongoose.connect(`${process.env.MONGO_URL}/${DB_Name}`)
      console.log(`\n MongoDb connection successfully at  ${connectionResponse.connection.host}`)
    } catch (error) {
       console.log("Mongo DB connection Error ",error);
       process.exit(1) 
    }
 }

 export default connectDB;


//  (async () => {
//     try {
//       console.log('MongoDB Connection String:', process.env.MONGO_URL);
//       await mongoose.connect(`${process.env.MONGO_URL}/${DB_Name}`);
//       console.log(`${process.env.MONGO_URL}`);
//       app.on("error",(error)=>{
//           console.log("Error In connection",error)
//       })
//       app.listen(process.env.PORT,()=>{
//           console.log(`App is listening on port ${process.env.PORT}`)
//       })
//     } catch (error) {
//       console.log("Error in Database Connection", error);
//     }
//   })();