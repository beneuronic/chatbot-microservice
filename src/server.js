import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import routes from './routes/index.js';
import { connectDB } from './config/db.js';
import instructionRoutes from "./routes/instruction.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import chatbotRoutes from "./routes/chatbot.routes.js";

dotenv.config();
connectDB();

const app = express();

// 🟢 CORS configuration
const allowedOrigins = [
  'https://neuronicdev.es',
  'https://www.neuronicdev.es',
  'http://localhost:10003',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// ✅ Rutas principales
// app.use('/api', routes);
app.use("/api/chatbot", chatbotRoutes);


// ✅ NUEVO: rutas específicas para las instrucciones
app.use("/api/instructions", instructionRoutes); // 👈 Añadir esto

app.use("/api/conversations", conversationRoutes);

// ✅ Ruta raíz de prueba
app.get('/', (req, res) => {
  res.send('Chatbot Microservice is running 🚀');
});

app.get('/status', (req, res) => {
  res.json({ message: 'API running successfully' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
