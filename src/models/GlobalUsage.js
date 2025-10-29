import mongoose from "mongoose";

const globalUsageSchema = new mongoose.Schema({
  totalMessages: { type: Number, default: 0 },
  limit: { type: Number, default: 2500 }, // 💬 límite global compartido
  lastReset: { type: Date, default: Date.now },
});

export const GlobalUsage = mongoose.model("GlobalUsage", globalUsageSchema);
