import dotenv from "dotenv";
dotenv.config(); // 👈 Cargar variables antes que nada

import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { connectDB } from "./config/db.js";

// 👇 Conexión a MongoDB
connectDB();

const allowedOrigins = [
  "https://neuronicdev.es/mcatalunya", // tu dominio real de WordPress
  "http://localhost:4000", // para desarrollo local
];

const app = express();

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// ✅ Rutas principales
app.use("/api", routes);

// ✅ Ruta raíz de prueba
app.get("/", (req, res) => {
  res.send("Chatbot Microservice is running 🚀");
});

app.get("/status", (req, res) => {
  res.json({ message: "API running successfully" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
