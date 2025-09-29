import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import routes from './routes/index.js';
import userRoutes from './routesUser/index.js';
import error from './middlewares/error.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { scheduleCurrencyRefresh } from "./services/currency.service.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.set('trust proxy', true)
// ✅ مفككات الجسم أولًا
app.use(express.json({ limit: '10mb', type: 'application/json' })); // مهم
app.use(express.urlencoded({ extended: true })); // للـ x-www-form-urlencoded

// لوجينغ أثناء التطوير
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ✅ ركّب الراوترات بعد مفككات الجسم
app.use('/v1', routes);
app.use('/user/v1', userRoutes);

// أمان/ضغط/تعقيم — بعد فك الجسم
app.use(helmet());
app.use(compression());
app.use(mongoSanitize());
// scheduleCurrencyRefresh();

// أخطاء
app.use(error.notFound);
app.use(error.converter);
app.use(error.handler);

export default app;
