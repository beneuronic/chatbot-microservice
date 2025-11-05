import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import routes from './routes/index.js';
import { connectDB } from './config/db.js';
import instructionRoutes from "./routes/instruction.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import analysisRoutes from "./routes/analysis.routes.js";
import tenantRoutes from "./routes/tenant.routes.js";
import knowledgeRoutes from "./routes/knowledge.routes.js";

dotenv.config();
connectDB();

const app = express();

// 🟢 CORS — versión final para producción
const allowedOrigins = [
  "https://neuronicdev.es",
  "https://www.neuronicdev.es",
  "http://localhost:4000",  // para test local del microservicio
  "http://localhost:10003", // para test local del WP
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Permitir solo orígenes válidos
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  // Métodos y cabeceras permitidas
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Preflight (CORS OPTIONS)
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});


app.use(express.json());

app.use("/api/tenants", tenantRoutes);
app.use("/api/knowledge", knowledgeRoutes);

// ✅ Rutas principales
// app.use('/api', routes);
app.use("/api/chatbot", chatbotRoutes);

app.use("/api/analysis", analysisRoutes);

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
