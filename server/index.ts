import express from 'express';
import routes from './routes';
import dotenv from 'dotenv';
dotenv.config();

import plannerRoutes from './routes/planner';

const app = express();
app.use(express.json());
app.use('/api/planner', plannerRoutes);
app.use('/api', routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('OPENAI_API_KEY loaded:', process.env.OPENAI_API_KEY ? '✅ YES (length: ' + process.env.OPENAI_API_KEY.length + ')' : '❌ NO');
});
