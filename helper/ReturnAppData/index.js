// helper/ReturnAppData/index.js

const response = ({ res, httpStatus = 200, status = true, message = 'success', data, other = {} }) => {
  const body = {
    status,
    message,
    ...other,
  };

  if (typeof data !== 'undefined') body.data = data;

  return res.status(httpStatus).json(body);
};

const getData = ({ res, data, other = {}, status = 200, message = 'success' }) =>
  response({ res, httpStatus: status, status: true, message, data, other });

const getError = ({ res, message = 'failed', other = {}, status = 400 }) =>
  response({ res, httpStatus: status, status: false, message, other });

const createData = ({ res, data, message = 'created successfully', other = {}, status = 201 }) =>
  response({ res, httpStatus: status, status: true, message, data, other });

const createError = ({ res, message = 'create failed', other = {}, status = 400 }) =>
  response({ res, httpStatus: status, status: false, message, other });

const updateData = ({ res, data, other = {}, status = 200, message = 'updated successfully' }) =>
  response({ res, httpStatus: status, status: true, message, data, other });

const updateError = ({ res, message = 'update failed', other = {}, status = 400 }) =>
  response({ res, httpStatus: status, status: false, message, other });

const deleteData = ({ res, other = {}, status = 200, message = 'deleted successfully' }) =>
  response({ res, httpStatus: status, status: true, message, other });

const deleteError = ({ res, message = 'delete failed', other = {}, status = 400 }) =>
  response({ res, httpStatus: status, status: false, message, other });

export default {
  getData,
  getError,
  createData,
  createError,
  updateData,
  updateError,
  deleteData,
  deleteError,
};
