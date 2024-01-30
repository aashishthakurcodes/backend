const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req,res, next)).catch((err)=>next(err))
  };
};

export { asyncHandler };

// const asyncHandlers =(function) =>async(res,req,next)=>{
// try {
//     await function(req,res,next)
// } catch (error) {
//     res.status(error.code || 500).json({
// success:false,
// messsage:error.messsage
//     })
// }
// }
