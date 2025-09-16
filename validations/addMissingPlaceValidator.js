import * as yup from 'yup';

export const placeValidationSchema = yup.object().shape({
    name: yup.string().required('Name is required'),
    mainCategory: yup.string().required('Main category is required'),
    subCategory: yup.string().required('Subcategory is required'),
    phone: yup.string().required('Phone is required'),
    message: yup.string().required('Message is required'),
    whatsapp: yup.string().optional(),
    faceBook: yup.string().optional(),
    insta: yup.string().optional(),
    // email: yup.string().email('Invalid email format').required('Email is required'),
    // image: yup.string().optional(),
    opentime: yup.string().optional(),
    closetime: yup.string().optional(),
    longitude: yup.number().required('Longitude is required'),
    latitude: yup.number().required('Latitude is required'),
    acceptOne: yup.boolean().required('Accept One is required'),
    acceptTwo: yup.boolean().required('Accept Two is required'),
    acceptThree: yup.boolean().required('Accept Three is required'),
    recaptcha: yup.boolean().required('Recaptcha is required'),
    device_id: yup.string().required('Device ID is required'),
});
