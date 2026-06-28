import yup from 'yup';

const strongPasswordRe =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
const phoneCodeRe = /^\+?\d{1,4}$/;
const phoneNumberRe = /^[0-9()\-\s]{4,24}$/;

const birthday = yup.string().trim().test(
  'valid-birthday',
  'Birthday is invalid or in the future',
  (value) => {
    if (value === undefined || value === null || value === '') return true;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return false;
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oldestAllowed = new Date(today);
    oldestAllowed.setFullYear(today.getFullYear() - 120);
    return normalized <= today && normalized >= oldestAllowed;
  }
);

const schemas = {
  emptyBodySchema: yup.object({
    body: yup.object({}).noUnknown(true, 'Unknown fields are not allowed'),
  }),

  loginSchema: yup.object({
    // "email" is an identifier: it may be an email OR a phone number, so do not
    // constrain its format here (the controller resolves which it is).
    body: yup.object({
      email: yup.string().trim().required('Email or phone is required'),
      password: yup.string().required('Password is required'),
    }),
  }),

  logoutSchema: yup.object({
    body: yup.object({
      refreshToken: yup.string().trim(),
      refresh_token: yup.string().trim(),
    }).noUnknown(true, 'Unknown logout field'),
  }),

  refreshTokenSchema: yup.object({
    body: yup.object({
      refreshToken: yup.string().required(),
    }),
  }),

  // Mirrors the required-field check inside RegisterController (email, password,
  // first_name, last_name, gender, birthday, candidate_stage). Formats are left
  // unconstrained so we never reject a request the controller would accept.
  registerSchema: yup.object({
    body: yup.object({
      email: yup.string().trim().required(),
      password: yup.string().required(),
      first_name: yup.string().trim().required(),
      last_name: yup.string().trim().required(),
      gender: yup.string().trim().required(),
      birthday: yup.string().trim().required(),
      candidate_stage: yup.string().trim().required(),
    }),
  }),

  campusRegisterSchema: yup.object({
    body: yup.object({
      email: yup.string().trim().email(),
      student_email: yup.string().trim().email(),
      password: yup.string().required(),
      first_name: yup.string().trim().required(),
      last_name: yup.string().trim().required(),
      gender: yup.string().trim().required(),
      birthday: yup.string().trim().required(),
      candidate_stage: yup.string().trim(),
      is_student: yup.boolean(),
      accept_terms: yup.boolean(),
      terms_accepted: yup.boolean(),
      phone_code: yup.string().trim().matches(phoneCodeRe, 'Invalid phone code'),
      phone_number: yup.string().trim().matches(phoneNumberRe, 'Invalid phone number'),
      university: yup.string().trim().max(200),
      specialty: yup.string().trim().max(200),
      graduation_year: yup.string().trim().max(4),
      device: yup.object(),
      student_profile: yup.object(),
      registration_profile: yup.object(),
    }).test(
      'student-email-present',
      'Student email is required',
      (value = {}) => Boolean(value.email || value.student_email)
    ),
  }),

  universityLoginSchema: yup.object({
    body: yup.object({
      email: yup.string().trim().email().required('University email is required'),
      password: yup.string().required('Password is required'),
      device: yup.object(),
    }),
  }),

  updateImageSchema: yup.object({
    body: yup.object({}).noUnknown(true, 'Unknown profile image field'),
  }),

  updateProfileSchema: yup.object({
    body: yup.object({
      first_name: yup.string().trim().min(2).max(100),
      last_name: yup.string().trim().min(2).max(100),
      mid_name: yup.string().trim().max(100),
      phone_code: yup.string().trim().matches(phoneCodeRe, 'Invalid phone code'),
      phone_number: yup.string().trim().matches(phoneNumberRe, 'Invalid phone number'),
      email: yup.string().trim().lowercase().email().max(254),
      password: yup.string().max(128).matches(strongPasswordRe, 'Weak password'),
      birthday,
    })
      .noUnknown(true, 'Unknown profile field')
      .test(
        'phone-pair',
        'Both phone_code and phone_number are required together',
        (value = {}) =>
          (value.phone_code === undefined && value.phone_number === undefined) ||
          (Boolean(value.phone_code) && Boolean(value.phone_number))
      ),
  }),

  // passcode-verify / passcode-forgot-password: identifier (email OR phone) +
  // the one-time code. device is optional and left unconstrained.
  passcodeVerifySchema: yup.object({
    body: yup.object({
      email: yup.string().trim().required('Email or phone is required'),
      passcode: yup.string().trim().required('Passcode is required'),
    }),
  }),

  resendOtpSchema: yup.object({
    body: yup.object({
      email: yup.string().trim().required('Email or phone is required'),
      type: yup.string().trim(),
    }),
  }),

  forgotPasswordSchema: yup.object({
    body: yup.object({
      email: yup.string().trim().required('Email or phone is required'),
    }),
  }),

  // /resetPassword -> ForGotPasswordResetPasswordController reads { email, password }.
  forgotResetPasswordSchema: yup.object({
    body: yup.object({
      email: yup.string().trim().required('Email or phone is required'),
      password: yup.string().required('Password is required'),
    }),
  }),

  resetPasswordSchema: yup.object({
    body: yup.object({
      password: yup.string().min(3).max(128).required(),
      newPassword: yup.string()
      .required('please enter your password')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Must Contain 8 Characters, 1 Uppercase, 1 Lowercase, 1 Number and 1 special Character"
        ),

      newPasswordConfirm: yup
        .string()
        .required()
        .oneOf([yup.ref('newPassword'), null], 'Passwords must match'),
    }),
  }),

  googleUserSchema: yup.object({
    body: yup.object({
      token : yup.string().required()
    })
  })
}
 
export default schemas;
