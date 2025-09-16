// controllers/role.controller.js

import ReturnDashData from "../../helper/ReturnDashData/index.js";
import { RoleModel } from "../../models/index.js";

/**
 * CREATE
 */
 const create = async (req, res, next) => {
  try {
    const payload = req.body;
    if (payload.name) {
      const exists = await RoleModel.findOne({ name: payload.name });
      if (exists) {
        return ReturnDashData.createError({
          res,
          message: "Role with this name already exists",
        });
      }
    }
    const doc = await RoleModel.create(payload);
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
 * توقع: /roles/:id
 */
 const update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doc = await RoleModel.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return ReturnDashData.updateError({
        res,
        message: "Role not found",
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
      sort = "role_number",
      search = "",
    } = req.query;

    const filter = {};
    if (search) {
      // مثال: البحث بالاسم (عدّل حسب حقولك)
      filter.name = { $regex: search, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      RoleModel.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      RoleModel.countDocuments(filter),
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
 * توقع: /roles/:id
 */
 const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await RoleModel.findById(id);
    if (!doc) {
      return ReturnDashData.getError({
        res,
        message: "Role not found",
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
 * توقع: /roles/:id
 */
 const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await RoleModel.findByIdAndDelete(id);
    if (!doc) {
      return ReturnDashData.deleteError({
        res,
        message: "Role not found",
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