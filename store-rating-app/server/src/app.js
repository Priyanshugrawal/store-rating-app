const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { clientOrigins } = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      // allow tools without an Origin header (curl, Postman, server-to-server)
      if (!origin || clientOrigins.includes(origin)) return cb(null, true);
      return cb(new AppError('Origin not allowed by CORS', 403));
    },
  })
);
app.use(express.json({ limit: '10kb' }));

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
