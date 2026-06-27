// Generic request validator. Pass a yup schema shaped like
//   yup.object({ body: ..., params: ..., query: ... })
// On failure it forwards the yup ValidationError to the central error
// handler (middlewares/error.js), which converts it to a 400 response.
const validate = (schema) => async (req, res, next) => {
  try {
    await schema.validate(
      { body: req.body, params: req.params, query: req.query },
      { abortEarly: false }
    );
    return next();
  } catch (err) {
    return next(err);
  }
};

export default validate;
export { validate };
