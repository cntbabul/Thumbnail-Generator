import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import connectDB from './db/index.js';
import jobRoutes from './routes/job.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3010;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', jobRoutes);

// Connect to MongoDB and start server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Express server running on http://localhost:${port}`);
  });
});
