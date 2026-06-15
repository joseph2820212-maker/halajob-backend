// controllers/Country.controller.js

import ReturnDashData from "../../helper/ReturnDashData/index.js";
import { CountryModel } from "../../models/index.js";

/**
 * CREATE
 */
 const create = async (req, res, next) => {
  try {
    const payload = req.body;
    if (payload.name) {
      const exists = await CountryModel.findOne({ name: payload.name });
      if (exists) {
        return ReturnDashData.createError({
          res,
          message: "Country with this name already exists",
        });
      }
    }
    const doc = await CountryModel.create(payload);
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
 * توقع: /Countrys/:id
 */
 const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    let data=req.body;
    if (data.accepted) {
     data.accepted=true;
     data.status=true;
     data.can_upload=false;
    }
    const doc = await CountryModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return ReturnDashData.updateError({
        res,
        message: "Country not found",
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
      limit = 5,
      sort = "country_name_en", // أو "-Country_number" للنزول
      search = "",
    } = req.query;

    const filter = {};
    if (search) {
      // مثال: البحث بالاسم (عدّل الحقل حسب الحاجة)
      filter.country_name_en = { $regex: search, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      CountryModel.find(filter)
        .sort(sort) // مثال: "-Country_number" = desc
        .skip(skip)
        .limit(Number(limit)) ,
      CountryModel.countDocuments(filter),
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
 * توقع: /Countrys/:id
 */
 const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await CountryModel.findById(id);
    if (!doc) {
      return ReturnDashData.getError({
        res,
        message: "Country not found",
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
 * توقع: /Countrys/:id
 */
 const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await CountryModel.findByIdAndDelete(id);
    if (!doc) {
      return ReturnDashData.deleteError({
        res,
        message: "Country not found",
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
