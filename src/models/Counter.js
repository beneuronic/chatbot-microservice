// src/models/Counter.js
import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  tenant: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

// Índice para acceso rápido por tenant
counterSchema.index({ tenant: 1 });

export default mongoose.model("Counter", counterSchema);
