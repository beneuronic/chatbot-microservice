import express from "express";
import chatbotRoutes from "./chatbot.routes.js";

const router = express.Router();

// ✅ Monta todas las rutas del chatbot bajo /api
router.use("/", chatbotRoutes);

export default router;
