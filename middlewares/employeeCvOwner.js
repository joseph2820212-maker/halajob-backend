// middlewares/employeeCvOwner.js
import fs from "fs";
import path from "path";
import { EmployeeModel } from "../models/index.js";
import { getAuthUserId } from "../helper/employeeDash/employeeDashHelpers.js";

export const checkEmployeeCvOwner = async (req, res, next) => {
  try {
    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: "cv_file_required",
      });
    }

    const fileUrl = `/cv/cvUpload/${fileName}`;

    const employee = await EmployeeModel.findOne({
      user_id: getAuthUserId(req),
      "cvs.url": fileUrl,
    })
      .select("_id cvs")
      .lean();

    if (!employee) {
      return res.status(403).json({
        success: false,
        message: "you_are_not_allowed_to_access_this_cv",
      });
    }

    const cv = employee.cvs.find((item) => item.url === fileUrl);

    const filePath =
      cv?.filePath || path.join(process.cwd(), "cv", "cvUpload", fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "cv_file_not_found",
      });
    }

    req.cvFilePath = filePath;
    req.cvFileName = cv?.fileName || fileName;

    next();
  } catch (error) {
    next(error);
  }
};