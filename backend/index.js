import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import apiRouter from './api/profile_router.js';
import mongoose from 'mongoose';
import settingsRouter from './api/settings_router.js';
import { startCron } from './api/utils/start_cron.js';
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors({
  origin: ['https://tleeleliminatorsbackend.vercel.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use('/api', apiRouter);
app.use('/api/settings', settingsRouter)
app.get('/', (req, res) => {
  res.json({message: 'Hello from the backend!'});
});

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, dbName: "codeforces" }).then(() => {
    console.log('Successfully connected to the database');
    startCron();
  })
  .catch((err) => {
    console.error('Error connecting to the database', err);
  });;

app.listen(PORT, () => {
  console.log(`Server is running on port :${PORT}`);
});
export default app;
