import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { UserModel } from "../../../models/index.js";
import {
  getOrCreateNotificationPreferences,
  updateNotificationPreferences,
} from "../../../services/notifications/notificationPreference.service.js";
import { buildManualWhatsappLink } from "../../../services/communication/manualWhatsappLink.service.js";

const userIdFrom = (req) => req.user?._id || req.user?.id;

export const getPreferences = async (req, res, next) => {
  try {
    const preferences = await getOrCreateNotificationPreferences(userIdFrom(req));
    return ReturnAppData.getData({
      res,
      message: "communication_preferences",
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req, res, next) => {
  try {
    const preferences = await updateNotificationPreferences({
      userId: userIdFrom(req),
      actorUserId: userIdFrom(req),
      body: req.body || {},
    });
    return ReturnAppData.updateData({
      res,
      message: "communication_preferences_updated",
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
};

export const createManualWhatsappLink = async (req, res, next) => {
  try {
    const user = await UserModel.findById(userIdFrom(req))
      .select("phone phone_e164 phone_code phone_national")
      .lean();
    const phone =
      req.body?.phone ||
      req.body?.recipient ||
      user?.phone_e164 ||
      user?.phone ||
      [user?.phone_code, user?.phone_national].filter(Boolean).join("");
    const link = buildManualWhatsappLink({
      phone,
      text: req.body?.text || req.body?.message || req.body?.body,
    });

    return ReturnAppData.createData({
      res,
      message: "manual_whatsapp_link",
      data: link,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createManualWhatsappLink,
  getPreferences,
  updatePreferences,
};
