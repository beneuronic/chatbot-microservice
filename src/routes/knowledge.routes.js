import express from "express";
import { syncKnowledge } from "../controllers/knowledge.controller.js";

const router = express.Router();

// Recibe desde WordPress las páginas autorizadas
router.post("/sync", syncKnowledge);

export default router;
