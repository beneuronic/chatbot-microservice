import Message from "../models/Message.js";
import Usage from "../models/Usage.js";
import { GlobalUsage } from "../models/GlobalUsage.js";
import Tenant from "../models/Tenant.js";

/**
 * Obtiene estadísticas completas del chatbot para un tenant concreto.
 * Endpoint: GET /api/analysis?tenant=xxx
 */
export const getAnalysisByTenant = async (req, res) => {
  try {
    const { tenant } = req.query;
    if (!tenant) return res.status(400).json({ error: "Missing tenant parameter" });

    const tenantData = await Tenant.findOne({ name: tenant });
    if (!tenantData) return res.status(404).json({ error: `Tenant '${tenant}' not found` });

    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - 7));
    const startOfMonth = new Date(now.setDate(now.getDate() - 30));

    // 📊 Totales
    const totalMessages = await Message.countDocuments({ tenant });
    const todayMessages = await Message.countDocuments({ tenant, createdAt: { $gte: startOfToday } });
    const weekMessages = await Message.countDocuments({ tenant, createdAt: { $gte: startOfWeek } });
    const monthMessages = await Message.countDocuments({ tenant, createdAt: { $gte: startOfMonth } });

    // 💾 Uso y límites
    const usage = await Usage.findOne({ tenant });
    const globalUsage = await GlobalUsage.findOne();

    const limit = usage?.limit || tenantData.messageLimit || 1000;
    const used = usage?.totalMessages || 0;
    const remaining = limit - used;
    const percent = ((used / limit) * 100).toFixed(1);

    // 📈 Crecimiento
    const lastWeekMessages = await Message.countDocuments({
      tenant,
      createdAt: { $gte: new Date(now - 14 * 24 * 60 * 60 * 1000), $lt: startOfWeek },
    });
    const growthWeek = lastWeekMessages
      ? (((weekMessages - lastWeekMessages) / lastWeekMessages) * 100).toFixed(1)
      : 0;

    const lastMonthMessages = await Message.countDocuments({
      tenant,
      createdAt: { $gte: new Date(now - 60 * 24 * 60 * 60 * 1000), $lt: startOfMonth },
    });
    const growthMonth = lastMonthMessages
      ? (((monthMessages - lastMonthMessages) / lastMonthMessages) * 100).toFixed(1)
      : 0;

    // 🗂️ Últimos mensajes
    const latestMessages = await Message.find({ tenant })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("message reply createdAt");

    // 📦 Respuesta consolidada
    res.json({
      tenant,
      tenantInfo: {
        language: tenantData.language,
        prompt: tenantData.prompt,
        createdAt: tenantData.createdAt,
      },
      messages: {
        total: totalMessages,
        today: todayMessages,
        week: weekMessages,
        month: monthMessages,
      },
      usage: { used, remaining, limit, percent },
      growth: { week: `${growthWeek}%`, month: `${growthMonth}%` },
      latestMessages,
    });
  } catch (err) {
    console.error("❌ Error in getAnalysisByTenant:", err);
    res.status(500).json({ error: "Error fetching analysis data" });
  }
};

