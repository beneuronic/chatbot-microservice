import express from "express";
import { handleChatMessage } from "../controllers/chatbot.controller.js";

const router = express.Router();

// Endpoint principal
router.post("/chatbot/message", handleChatMessage);

// Endpoint de prueba opcional
router.get("/chatbot/status", (req, res) => {
  res.json({ status: "ok", service: "Chatbot Microservice" });
});

export default router;
