import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { UserModel } from "../../../models/index.js";
import { sendRecoveryEmail } from "../../../helper/sendEmail.js";
import { clearRefreshToken, generateAccessTokenFromRefreshTokenPayload, verifyRefreshToken } from "../../../services/tokenService.js";
import { verifyUserFromRefreshTokenPayload } from "../../../services/authService.js";

/** تطبيع السلاسل */
const normStr = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");
const safeStr = (v) => (typeof v === "string" ? v.trim() : "");

/** تطبيع الإيميل */
const normEmail = (e) => (e || "").trim().toLowerCase();

/** تحويل القيم “المشابهة للمنطقية” إلى Boolean */
const toBool = (v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return ["true", "1", "yes", "y"].includes(v.trim().toLowerCase());
  return false;
};

/** مطابقة جهازين بشكل متسامح مع build_id ومتشدّد مع model_id عند توفره */
function isDeviceMatch(a = {}, b = {}) {
  const brandA = normStr(a.brand), brandB = normStr(b.brand);
  const modelA = normStr(a.model_name), modelB = normStr(b.model_name);
  const isDevA = !!a.is_device, isDevB = !!b.is_device;

  // لازم العلامة + الموديل + نوع الجهاز تتطابق
  if (!brandA || !modelA) return false;
  if (brandA !== brandB || modelA !== modelB || isDevA !== isDevB) return false;

  // لو model_id موجود في الاثنين ويختلف → جهاز مختلف
  const midA = normStr(a.model_id || "");
  const midB = normStr(b.model_id || "");
  if (midA && midB && midA !== midB) return false;

  // build_id لا يُستخدم كشرط رفض (يتغير مع التحديثات)
  return true;
}

const login = async (req, res, next) => {
  const lan = req.get("lan") || "en";

  try {
    const data = req.body || {};
    const { email, password, device = {} } = data;

    // تحقق أساسي
    if (!email || !password) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message:
          lan === "ar" ? "البريد وكلمة المرور مطلوبة." : "Email and password are required.",
      });
    }

    // تحقق الجهاز (اسم العلامة والموديل مطلوبة، is_device يمكن أن يأتي 0/1 أو true/false)
    const hasBrand = typeof device.brand === "string" && device.brand.trim();
    const hasModel = typeof device.model_name === "string" && device.model_name.trim();
    const hasIsDevice = device.hasOwnProperty("is_device");

    if (!hasBrand || !hasModel || !hasIsDevice) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "بيانات الجهاز مفقودة" : "Device data is missing.",
      });
    }

    // جلب المستخدم (بدون .lean() حتى نستطيع استخدام .save())
    let user = null;
    if (email.includes("@")) {
      user = await UserModel.findOne({ email: normEmail(email) });
    } else {
      user = await UserModel.findOne({ phone_national: email });
    }

    if (!user) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "البيانات المرسلة غير صحيحة" : "The data sent is incorrect",
      });
    }

    // TODO: تحقق كلمة المرور الفعلي (hash/compare)
    // const ok = await user.comparePassword(password);
    // if (!ok) { ... }
const {brand,model_name,model_id,is_device,build_id}=data.device
 let isNew=user.device.findIndex(d=>d.brand===brand&&d.model_name===model_name)
  console.log('====================================');
  console.log(isNew);
  console.log('====================================');
    // إذا الحساب غير مُفعّل: أعد إرسال كود التفعيل على الإيميل
    if (isNew>0) {
      const passcode = Math.floor(10000 + Math.random() * 90000);
      const passcode_expires_at = new Date(Date.now() + 10 * 60 * 1000);
   
      user.passcode = passcode;
      user.passcode_expires_at = passcode_expires_at;
      await user.save();

      await sendRecoveryEmail({ to: user.email, passcode });

      return ReturnAppData.createError({
        res,
        status: 403,
        message:
          lan === "ar"
            ? "يرجى ادخال الكود المرسل على الايميل"
            : "Please enter the code sent to the email",
      });
    }

    // قائمة الأجهزة المحفوظة (تدعم كونها كائن أو مصفوفة)
    const savedDevices = Array.isArray(user.device)
      ? user.device
      : user.device
      ? [user.device]
      : [];

    // تجهيز الجهاز الوارد
    const incomingDevice = {
      brand: safeStr(device.brand),
      model_name: safeStr(device.model_name),
      model_id: typeof device.model_id === "string" ? safeStr(device.model_id) : null,
      is_device: toBool(device.is_device),
      build_id: typeof device.build_id === "string" ? safeStr(device.build_id) : null,
      is_default: false,
      last_seen_at: new Date(),
    };

    // محاولة التعرف على الجهاز
    const idx = savedDevices.findIndex((d) => isDeviceMatch(d, incomingDevice));
    const known = idx >= 0 ? savedDevices[idx] : null;

    if (known) {
      // جهاز معروف → نجاح الدخول
      try {
        known.last_seen_at = new Date();

        if (
          incomingDevice.build_id &&
          (!known.build_id || known.build_id !== incomingDevice.build_id)
        ) {
          known.build_id = incomingDevice.build_id;
        }

        // لو model_id الجديد موجود ولم يكن مخزناً، خزّنه
        if (incomingDevice.model_id && !known.model_id) {
          known.model_id = incomingDevice.model_id;
        }

        if (typeof user.markModified === "function") {
          user.markModified("device");
        }
        await user.save();
      } catch (_) {
        // تحديث معلومات الجهاز ليس حرجاً للدخول
      }

      // TODO: إصدار توكنات
      return ReturnAppData.createData({
        res,
        status: 200,
        data: {
          user_id: user._id,
          device_recognized: true,
        },
        message: lan === "ar" ? "تم تسجيل الدخول بنجاح." : "Logged in successfully.",
      });
    }

    // جهاز جديد → أرسل كود تحقق 2FA قصير الأجل
    const twofa = Math.floor(10 + Math.random() * 90); // 6 أرقام
    const twofa_expires_at = new Date(Date.now() + 10 * 60 * 1000);

    // خزّن بيانات الكود والجهاز المراد اعتماده مؤقتاً
    user.another_device_code = twofa;
    user.another_device_expires_at = twofa_expires_at;
    user.pending_device = incomingDevice; // لحين إدخال الكود الصحيح
    
    user.device=[...user.device,{
       brand,
      model_name,
      model_id,  //null or string,
      is_device,  //1 or 0 is emulator
      build_id
    }]
    await user.save();

    await sendRecoveryEmail({
      to: user.email,
      passcode: twofa,
    });

    return ReturnAppData.createData({
      res,
      status: 202,
      data: {
        step: "VERIFY_NEW_DEVICE",
      },
      message:
        lan === "ar"
          ? "جهاز جديد تم رصده. أرسلنا رمز تحقق إلى بريدك. يرجى إدخاله لإكمال تسجيل الدخول."
          : "New device detected. We sent a verification code to your email. Enter it to complete sign-in.",
    });
  } catch (err) {
    console.error("login error:", err);
    return ReturnAppData.createError({
      res,
      status: 500,
      message: lan === "ar" ? "حدث خطأ غير متوقع." : "An unexpected error occurred.",
    });
  }
};

const logout=async(req,res,next)=>{
  const lan = req.get("lan") || "en";
  await clearRefreshToken(req.body.refreshToken);
   return ReturnAppData.createData({
      res,
      status: 200,
      message: lan === "ar" ? "تم تسجيل الخروج بنجاح" : "Successfully logged out",
    });
}
const refreshToken = async (req, res, next) => {
    try {
      let refreshTokenPayload = await verifyRefreshToken(req.body.refreshToken);
      await verifyUserFromRefreshTokenPayload(refreshTokenPayload);
      let newAccessToken = await generateAccessTokenFromRefreshTokenPayload(
        refreshTokenPayload
      );
   return ReturnAppData.createData({
      res,
      status: 200,
     data:{ accessToken: newAccessToken},
    });
  
    } catch (error) {
      next(error);
    }
  };
export default { login ,logout,refreshToken};
