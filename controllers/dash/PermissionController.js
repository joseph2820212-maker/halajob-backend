// controllers/Permission.controller.js

import ReturnDashData from "../../helper/ReturnDashData/index.js";
import { PermissionModel } from "../../models/index.js";

/**
 * CREATE
 */
 const create = async (req, res, next) => {
  try {
    const payload = req.body;
    if (payload.name) {
      const exists = await PermissionModel.findOne({ name: payload.name });
      if (exists) {
        return ReturnDashData.createError({
          res,
          message: "Permission with this name already exists",
        });
      }
    }
    const doc = await PermissionModel.create(payload);
    return ReturnDashData.createData({ res, data: doc });
  } catch (err) {
    return ReturnDashData.createError({
      res,
      message: err.message || "Create failed",
      other: { code: err.code },
    });
  }
};

/**
 * UPDATE
 * توقع: /Permissions/:id
 */
 const update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doc = await PermissionModel.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return ReturnDashData.updateError({
        res,
        message: "Permission not found",
      });
    }
    return ReturnDashData.updateData({
      res,
      data: doc,
    });
  } catch (err) {
    return ReturnDashData.updateError({
      res,
      message: err.message || "Update failed",
      other: { code: err.code },
    });
  }
};

/**
 * GET (List with pagination & filters)
 * أمثلة باراميترز:
 *   ?page=1&limit=10&sort=-createdAt&search=admin
 */
 const get = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      search = "",
    } = req.query;

    const filter = {};
    if (search) {
      // مثال: البحث بالاسم (عدّل حسب حقولك)
      filter.name = { $regex: search, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      PermissionModel.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      PermissionModel.countDocuments(filter),
    ]);

    return ReturnDashData.getData({
      res,
      data: items,
      other: {
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    return ReturnDashData.getError({
      res,
      message: err.message || "Get failed",
    });
  }
};

/**
 * GET ONE
 * توقع: /Permissions/:id
 */
 const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await PermissionModel.findById(id);
    if (!doc) {
      return ReturnDashData.getError({
        res,
        message: "Permission not found",
      });
    }
    return ReturnDashData.getData({ res, data: doc });
  } catch (err) {
    return ReturnDashData.getError({
      res,
      message: err.message || "Get one failed",
    });
  }
};

/**
 * DELETE
 * توقع: /Permissions/:id
 */
 const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await PermissionModel.findByIdAndDelete(id);
    if (!doc) {
      return ReturnDashData.deleteError({
        res,
        message: "Permission not found",
      });
    }
    return ReturnDashData.deleteData({
      res,
      other: { id },
    });
  } catch (err) {
    return ReturnDashData.deleteError({
      res,
      message: err.message || "Delete failed",
    });
  }
};

export default {
 create,
 update,
 get,
 getOne,
 remove
}