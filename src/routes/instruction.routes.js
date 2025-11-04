import express from "express";
import {
  createInstruction,
  getInstructions,
  deleteInstruction,
} from "../controllers/instruction.controller.js";

const router = express.Router();

// Crear una nueva instrucción
router.post("/", createInstruction);

// Obtener todas las instrucciones de un tenant (por query o por parámetro)
router.get("/", getInstructions);      // ✅ acepta ?tenant=...
router.get("/:tenant", getInstructions); // ✅ acepta /tenant directamente

// Eliminar una instrucción por ID
router.delete("/:id", deleteInstruction);

export default router;
