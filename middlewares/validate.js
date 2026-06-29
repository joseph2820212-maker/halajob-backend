// Generic request validator. Pass a yup schema shaped like
//   yup.object({ body: ..., params: ..., query: ... })
// On failure it forwards the yup ValidationError to the central error
// handler (middlewares/error.js), which converts it to a 400 response.
const validate = (schema) => {
  const validateRequest = async (req, res, next) => {
    try {
      const validated = await schema.validate(
        { body: req.body, params: req.params, query: req.query },
        { abortEarly: false, stripUnknown: false }
      );
      if (Object.prototype.hasOwnProperty.call(validated, 'body')) req.body = validated.body || {};
      if (Object.prototype.hasOwnProperty.call(validated, 'params')) req.params = validated.params || {};
      if (Object.prototype.hasOwnProperty.call(validated, 'query')) req.query = validated.query || {};
      return next();
    } catch (err) {
      return next(err);
    }
  };

  return validateRequest;
};

export default validate;
export { validate };
