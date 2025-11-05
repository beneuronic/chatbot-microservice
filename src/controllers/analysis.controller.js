import Message from "../models/Message.js";
import Unanswered from "../models/Unanswered.js";
import Instruction from "../models/Instruction.js";
import Tenant from "../models/Tenant.js";
import { analyzeMessagesWithOpenAI, generateTips, analyzeSentiment } from "../services/analysis.service.js";

export const getAnalysis = async (req, res) => {
  try {
    const { tenant } = req.query;
    if (!tenant) return res.status(400).json({ error: "Tenant requerido" });

    const tenantData = await Tenant.findOne({ name: tenant });
    if (!tenantData) return res.status(404).json({ error: "Tenant no encontrado" });

    // Mensajes del tenant
    const messages = await Message.find({ tenant }).sort({ createdAt: -1 });
    const unanswered = await Unanswered.countDocuments({ tenant });
    const totalMessages = messages.length;
    const percentUnanswered = totalMessages ? ((unanswered / totalMessages) * 100).toFixed(1) : 0;

    // Texto para análisis
    const allText = messages.map(m => m.message).join(" ");
    const sampleMessages = messages.slice(-50).map(m => m.message).join("\n");

    // Análisis OpenAI
    const topicAnalysis = await analyzeMessagesWithOpenAI(allText);
    const tips = await generateTips(Object.keys(topicAnalysis).slice(0, 3), sampleMessages);
    const sentiment = await analyzeSentiment(sampleMessages);

    // Actividad por hora
    const activityByHour = {};
    messages.forEach(msg => {
      const h = new Date(msg.createdAt).getHours();
      activityByHour[h] = (activityByHour[h] || 0) + 1;
    });
    const activityLabels = Object.keys(activityByHour).map(h => `${h.padStart(2, "0")}:00`);

    res.json({
      tenant,
      tenantInfo: tenantData,
      messages: {
        total: totalMessages,
        unanswered,
        percentUnanswered,
      },
      analysis: topicAnalysis,
      tips,
      sentiment,
      activity: { labels: activityLabels, data: Object.values(activityByHour) },
      latestMessages: messages.slice(0, 10),
    });
  } catch (err) {
    console.error("❌ Error en getAnalysis:", err);
    res.status(500).json({ error: "Error generando análisis" });
  }
};
