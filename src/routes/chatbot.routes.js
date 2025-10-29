import express from "express";
import { handleChatMessage } from "../controllers/chatbot.controller.js";
import { Usage } from "../models/Usage.js";
import { GlobalUsage } from "../models/GlobalUsage.js";

const router = express.Router();

router.post("/message", handleChatMessage);

// ✅ Consulta uso individual
router.get("/usage/:tenant", async (req, res) => {
  const { tenant } = req.params;
  const usage = await Usage.findOne({ tenant });
  res.json({
    tenant,
    total: usage?.totalMessages || 0,
    limit: 1000,
    remaining: Math.max(0, 1000 - (usage?.totalMessages || 0)),
  });
});

// ✅ Consulta uso global
router.get("/usage", async (req, res) => {
  const global = await GlobalUsage.findOne();
  res.json({
    total: global?.totalMessages || 0,
    limit: global?.limit || 2500,
    remaining: Math.max(0, (global?.limit || 2500) - (global?.totalMessages || 0)),
  });
});

export default router;
