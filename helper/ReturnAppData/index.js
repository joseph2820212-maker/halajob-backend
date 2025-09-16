// utils/responseHandler.js

/**
 * دوال موحّدة لإرجاع الاستجابات (Responses) في Express
 */

const getData = ({ res, data, other = {} }) => {
  return res.status(200).json({
    status: true,
    message: "success",
    data,
    ...other,
  });
};

const getError = ({ res, message = "failed", other = {},status=400 }) => {
  return res.status(status).json({
    status: false,
    message,
    ...other,
  });
};

const createData = ({ res, data,message="created successfully", other = {} }) => {
  return res.status(201).json({
    status: true,
    message,
    data,
    ...other,
  });
};

const createError = ({ res, message = "create failed", other = {} }) => {
  return res.status(400).json({
    status: false,
    message,
    ...other,
  });
};

const updateData = ({ res, data, other = {} }) => {
  return res.status(202).json({
    status: true,
    message: "updated successfully",
    data,
    ...other,
  });
};

const updateError = ({ res, message = "update failed", other = {} }) => {
  return res.status(400).json({
    status: false,
    message,
    ...other,
  });
};

const deleteData = ({ res, other = {} }) => {
  return res.status(203).json({
    status: true,
    message: "deleted successfully",
    ...other,
  });
};

const deleteError = ({ res, message = "delete failed", other = {} }) => {
  return res.status(400).json({
    status: false,
    message,
    ...other,
  });
};

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
