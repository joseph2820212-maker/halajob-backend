import * as yup from 'yup';

export const offerValidationSchema = yup.object().shape({
    name: yup.string().required('Name is required'),
    phone: yup.string().required('Phone is required'),
    message: yup.string().required('Message is required'),
    whatsapp: yup.string().optional(),
    acceptOne: yup.boolean().required('Accept One is required'),
    acceptTwo: yup.boolean().required('Accept Two is required'),
    acceptThree: yup.boolean().required('Accept Three is required'),
    recaptcha: yup.boolean().required('Recaptcha is required'),
});
