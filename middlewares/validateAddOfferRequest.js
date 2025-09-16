export const validateOfferRequest = (schema) => {
 return async (req, res, next) => {
     try {
         await schema.validate(req.body, { abortEarly: false });
         next();
     } catch (error) {
         return res.status(400).json({
             errors: error.inner.map(err => ({
                 field: err.path,
                 message: err.message
             }))
         });
     }
 };
};
