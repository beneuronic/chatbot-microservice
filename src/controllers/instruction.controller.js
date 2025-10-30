import Instruction from "../models/Instruction.js";

/**
 * Crear una nueva instrucción
 */
export const createInstruction = async (req, res) => {
  try {
    const { tenant, text } = req.body;

    if (!tenant || !text)
      return res.status(400).json({ error: "Faltan campos obligatorios: tenant o text" });

    const instruction = await Instruction.create({ tenant, text });
    res.status(201).json(instruction);
  } catch (error) {
    console.error("❌ Error creando instrucción:", error);
    res.status(500).json({ error: "Error interno al crear la instrucción" });
  }
};

/**
 * Listar instrucciones por tenant
 */
export const getInstructionsByTenant = async (req, res) => {
  try {
    const { tenant } = req.params;
    const instructions = await Instruction.find({ tenant }).sort({ createdAt: 1 });
    res.json(instructions);
  } catch (error) {
    console.error("❌ Error obteniendo instrucciones:", error);
    res.status(500).json({ error: "Error interno al obtener instrucciones" });
  }
};

/**
 * Eliminar una instrucción por ID
 */
export const deleteInstruction = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Instruction.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Instrucción no encontrada" });
    res.json({ message: "Instrucción eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error eliminando instrucción:", error);
    res.status(500).json({ error: "Error interno al eliminar la instrucción" });
  }
};
