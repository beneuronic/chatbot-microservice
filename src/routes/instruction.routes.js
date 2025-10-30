import express from "express";
import {
  createInstruction,
  getInstructionsByTenant,
  deleteInstruction,
} from "../controllers/instruction.controller.js";

const router = express.Router();

// Crear una nueva instrucción
router.post("/", createInstruction);

// Obtener todas las instrucciones de un tenant
router.get("/:tenant", getInstructionsByTenant);

// Eliminar una instrucción por ID
router.delete("/:id", deleteInstruction);

export default router;
