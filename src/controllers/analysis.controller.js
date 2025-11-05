import { getChatbotAnalysis } from "../services/analysis.service.js";
import Tenant from "../models/Tenant.js";
import Usage from "../models/Usage.js";
import Message from "../models/Message.js";

/**
 * Controlador principal del endpoint GET /api/analysis
 */
export const getAnalysis = async (req, res) => {
  try {
    const { tenant } = req.query;
    if (!tenant) {
      return res.status(400).json({ error: "Tenant requerido en query string." });
    }

    // 🧱 Buscar datos del tenant
    const tenantData = await Tenant.findOne({ name: tenant, active: true }).lean();
    if (!tenantData) {
      return res.status(404).json({ error: `Tenant '${tenant}' no encontrado o inactivo.` });
    }

    // 📊 Analítica principal (mensajes, sentimiento, tips, temas...)
    const analysisData = await getChatbotAnalysis(tenant);

    // 🧾 Datos de uso globales
    const usageData = await Usage.findOne({ tenant }).lean();
    const totalUsed = usageData?.totalMessages || 0;
    const limit = tenantData?.messageLimit || 1000;
    const remaining = Math.max(limit - totalUsed, 0);
    const percentUsed = ((totalUsed / limit) * 100).toFixed(1);

    // 🕐 Últimos mensajes
    const latestMessages = await Message.find({ tenant })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("message reply createdAt -_id")
      .lean();

    // ✅ Estructura unificada de respuesta
    res.json({
      tenant,
      tenantInfo: {
        language: tenantData.language || "—",
        prompt: tenantData.prompt || "",
        createdAt: tenantData.createdAt,
      },
      messages: {
        total: analysisData.totalMessages,
        unanswered: analysisData.totalUnanswered,
        percentUnanswered: analysisData.percentUnanswered,
      },
      usage: {
        used: totalUsed,
        remaining,
        limit,
        percent: percentUsed,
      },
      analysis: {
        topics: analysisData.topics,
        tips: analysisData.tips,
        sentiment: analysisData.sentiment,
        activityByHour: analysisData.activityByHour,
        activityLabels: analysisData.activityLabels,
      },
      latestMessages,
    });
  } catch (error) {
    console.error("❌ Error en getAnalysis:", error);
    res.status(500).json({
      error: "Error generando el análisis del chatbot.",
      details: error.message,
    });
  }
};
