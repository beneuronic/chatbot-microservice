import express from "express";
import { getAnalysis } from "../controllers/analysis.controller.js";

const router = express.Router();
router.get("/", getAnalysis);

export default router;
