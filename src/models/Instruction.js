import mongoose from "mongoose";

const instructionSchema = new mongoose.Schema({
  tenant: { type: String, required: true, index: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Instruction", instructionSchema);

// tenant -> Identifica a qué parque o web pertenece la instrucción.
// text -> Contiene la instrucción concreta (“Don’t make up information”, “Answer only about Marineland”, etc.).
// createdAt -> Marca cuándo se creó (útil para ordenarlas por fecha).