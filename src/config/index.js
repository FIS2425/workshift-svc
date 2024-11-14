import mongoose from 'mongoose';
import api from '../api.js';

const MONGO_URI = process.env.MONGOURL;
const PORT = process.env.PORT || 3001;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('[Info] MongoDB connected');

    const app = api();

    app.listen(PORT, () => {
      console.log(`[Info] Server running on http://localhost:${PORT}/docs`);
    });
  })
  .catch((error) => {
    console.error('[Error] MongoDB Conexion error:', error.message);
  });
