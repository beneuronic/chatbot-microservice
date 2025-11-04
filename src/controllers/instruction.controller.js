import Instruction from "../models/Instruction.js";

/**
 * ✅ Crear una nueva instrucción
 */
export const createInstruction = async (req, res) => {
  try {
    const { tenant, text } = req.body;

    if (!tenant || !text) {
      return res.status(400).json({ error: "Faltan parámetros requeridos" });
    }

    const newInstruction = new Instruction({ tenant, text });
    await newInstruction.save();

    res.status(201).json(newInstruction);
  } catch (error) {
    console.error("❌ Error creando instrucción:", error);
    res.status(500).json({ error: "Error al crear la instrucción" });
  }
};

/**
 * ✅ Obtener instrucciones (por query o por parámetro)
 */
export const getInstructions = async (req, res) => {
  try {
    const tenant = req.query.tenant || req.params.tenant;

    if (!tenant) {
      return res.status(400).json({ error: "Debe especificar un tenant" });
    }

    const instructions = await Instruction.find({ tenant }).sort({ createdAt: 1 });

    if (!instructions.length) {
      return res.status(200).json([]);
    }

    res.json(instructions);
  } catch (error) {
    console.error("❌ Error obteniendo instrucciones:", error);
    res.status(500).json({ error: "Error interno al obtener instrucciones" });
  }
};

/**
 * ✅ Eliminar una instrucción por ID
 */
export const deleteInstruction = async (req, res) => {
  try {
    const { id } = req.params;
    await Instruction.findByIdAndDelete(id);
    res.json({ message: "Instrucción eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error eliminando instrucción:", error);
    res.status(500).json({ error: "Error al eliminar la instrucción" });
  }
};
