import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import routes from './routes/index.js';
import userRoutes from './routesUser/index.js';
import employeeRoutes from './routesEmployee/index.js';
import routesHealth from './routesHealth/index.js';

import error from './middlewares/error.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { scheduleCurrencyRefresh } from "./services/currency.service.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// حدد __filename و __dirname أول شيء

const app = express();

app.set('trust proxy', true);

// مفككات الجسم
app.use(express.json({ limit: '10mb', type: 'application/json' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'lan'],
}));
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "7d",
    index: false,
  })
);

app.use('/dash/v1', routes);
app.use('/employee/v1', employeeRoutes);
app.use('/health', routesHealth);
app.use('/user/v1', userRoutes);
// أمان/ضغط/تعقيم
app.use(helmet());
app.use(compression());
app.use(mongoSanitize());

// أخطاء
app.use(error.notFound);
app.use(error.converter);
app.use(error.handler);

export default app;


// npm i dictionary-en@3.1.0
// npm i wink-nlp
// npm i wink-eng-lite-web-model
// npm install araby
// npm install nspell
// npm install nspell dictionary-en araby wink-nlp wink-eng-lite-web-model

