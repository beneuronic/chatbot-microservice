import express from "express";
import { getAnalysisByTenant } from "../controllers/analysis.controller.js";

const router = express.Router();

// 📊 Ruta principal del análisis
router.get("/", getAnalysisByTenant);

export default router;
