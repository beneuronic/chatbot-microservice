import Message from "../models/Message.js";
import Tenant from "../models/Tenant.js";
import Usage from "../models/Usage.js";
import { analyzeMessagesWithOpenAI, generateUxTipsWithOpenAI, analyzeSentimentWithOpenAI } from "../services/analysis.service.js";

export const getAnalysis = async (req, res) => {
  try {
    const tenant = req.query.tenant;
    if (!tenant) return res.status(400).json({ error: "Missing tenant parameter" });

    console.log(`📊 Generando análisis para tenant: ${tenant}`);

    // Buscar información del tenant
    const tenantInfo = await Tenant.findOne({ name: tenant });
    if (!tenantInfo) {
      return res.status(404).json({ error: `Tenant '${tenant}' not found` });
    }

    // Obtener mensajes del tenant
    const messages = await Message.find({ tenant }).sort({ createdAt: -1 }).limit(500);
    const totalMessages = await Message.countDocuments({ tenant });
    const today = await Message.countDocuments({
      tenant,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });
    const week = await Message.countDocuments({
      tenant,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });
    const month = await Message.countDocuments({
      tenant,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    // Obtener uso
    const usage = await Usage.findOne({ tenant });
    const limit = tenantInfo?.messageLimit || 1000;
    const used = usage ? usage.totalMessages : totalMessages;
    const remaining = Math.max(0, limit - used);
    const percent = ((used / limit) * 100).toFixed(1);

    // Calcular crecimiento (dummy por ahora)
    const growth = { week: "0%", month: "0%" };

    // --- Generar análisis con OpenAI ---
    let analysis = {};
    let tips = "No tips available.";
    let sentiment = "Neutral";

    if (messages.length > 0) {
      const allMessages = messages.map((m) => m.message).join(" ");
      const sampleMessages = messages.slice(-50).map((m) => m.message).join("\n");

      try {
        analysis = await analyzeMessagesWithOpenAI(allMessages);
        const topics = Object.keys(analysis || {});
        tips = await generateUxTipsWithOpenAI(topics, sampleMessages);
        sentiment = await analyzeSentimentWithOpenAI(sampleMessages);
      } catch (err) {
        console.warn("⚠️ Error analizando mensajes:", err.message);
      }
    }

    // --- Analizar actividad por hora ---
    const hours = messages.map((m) => new Date(m.createdAt).getHours());
    const activity = {};
    for (let i = 0; i < 24; i++) activity[i] = 0;
    hours.forEach((h) => (activity[h] = (activity[h] || 0) + 1));
    const activityLabels = Object.keys(activity).map((h) => `${h.padStart(2, "0")}:00`);
    const activityData = Object.values(activity);

    // --- Respuesta final ---
    res.json({
      tenant,
      tenantInfo: {
        language: tenantInfo.language,
        prompt: tenantInfo.prompt,
        createdAt: tenantInfo.createdAt,
      },
      messages: { total: totalMessages, today, week, month },
      usage: { used, remaining, limit, percent },
      growth,
      analysis,
      activity: { labels: activityLabels, data: activityData },
      tips,
      sentiment,
      latestMessages: messages.slice(0, 10),
    });
  } catch (error) {
    console.error("❌ Error en getAnalysis:", error);
    res.status(500).json({ error: "Error generating analysis" });
  }
};
