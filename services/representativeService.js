import RepresentativeModel from "../models/RepresentativeModel.js";
import httpStatus from "http-status";
import ApiError from "../utils/apiError.js";

// Create a new representative
const createNewRepresentative = async (req) => {
  try {
    const newRepresentative = await RepresentativeModel.create(req);
    return newRepresentative;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error?.message || "Error creating a new representative");
  }
};
const editRepresentative = async (id, updateData) => {
  try {
    // تحديث بيانات الممثل
    const updatedRepresentative = await RepresentativeModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true } // إعادة المستند المحدث مع التحقق من صحة البيانات
    );

    if (!updatedRepresentative) {
      throw new ApiError(httpStatus.NOT_FOUND, "Representative not found");
    }

    return updatedRepresentative;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error?.message || "Error updating representative");
  }
};

// Get representatives with pagination
const getRepresentative = async (req, res) => {
 try {
   const pageNumber = parseInt(req.query.page) || 1; // Current page number
   const pageSize = parseInt(req.query.paginate)||5; // Items per page
   const skip = (pageNumber - 1) * pageSize;

   // Get search query if exists
   const searchQuery = req.query.search || ''; // Search string from the query params
   const arr=["about","phone"];
   // Construct the search filter if search query is present
   const searchFilter = searchQuery
     ? { $or: [ 
         { 'user.name': { $regex: searchQuery, $options: 'i' } }, // Case-insensitive match on name
         { 'user.email': { $regex: searchQuery, $options: 'i' } }, // Case-insensitive match on email
         ...arr.map((item) => ({
          [item]: { $regex: searchQuery, $options: 'i' }  // Search in specified fields (e.g., about, phone)
        }))// Case-insensitive match on about
       ] }
     : {}; // If no search, return all documents

   // Aggregation pipeline
   const pipeline = [
     {
       $lookup: {
         from: 'users', // The collection to join with
         localField: 'user_id', // Field in `RepresentativeModel`
         foreignField: '_id', // Field in `users` collection
         as: 'user', // The result array
       },
     },
     {
       $unwind: {
         path: '$user', // Flatten the userDetails array
         preserveNullAndEmptyArrays: true, // Keep representatives without matching users
       },
     },
     {
       $match: searchFilter, // Apply the search filter if it exists
     },
     {
       $skip: skip, // Pagination: Skip documents
     },
     {
       $limit: pageSize, // Pagination: Limit the number of documents
     },
   ];

   // Fetch data with aggregation
   const representatives = await RepresentativeModel.aggregate(pipeline);

   // Get total count for pagination with the search filter applied
   const total = await RepresentativeModel.countDocuments(searchFilter);

   const totalPages = Math.ceil(total / pageSize);

   return{
     data: representatives,
     total,
     req: req.query,
     limit: pageSize,
     page: pageNumber,
     pages: totalPages,
   };
 } catch (error) {
   console.error(error);
   return res.status(500).json({ message: error.message });
 }
};




export {
  createNewRepresentative,
  getRepresentative,
  editRepresentative
};
