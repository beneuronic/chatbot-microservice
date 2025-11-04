import Message from "../models/Message.js";
import { generateChatbotReply } from "../services/chatbot.service.js";
import Usage from "../models/Usage.js";
import { GlobalUsage } from "../models/GlobalUsage.js";
import Tenant from "../models/Tenant.js";
import Instruction from "../models/Instruction.js";

const TENANT_LIMIT = 1000;
const GLOBAL_LIMIT = 2500;

export const handleChatMessage = async (req, res) => {
  try {
    const { message, language = null, pageUrl, source = "web" } = req.body;
    let { tenant } = req.body;

    if (!message) return res.status(400).json({ error: "Mensaje vacío" });

    const origin = req.get("origin") || req.get("referer") || "";
    let tenantData = null;

    console.log("///////////////////////////////////////////////////////////");
    console.log("🧠 tenant recibido:", tenant);
    console.log("🌍 origin header:", origin || "(vacío)");

    // ==========================================================
    // 1️⃣ PRIORIDAD: Buscar por nombre exacto
    // ==========================================================
    if (tenant && tenant !== "auto") {
      tenantData = await Tenant.findOne({ name: tenant, active: true });
      if (tenantData) {
        console.log("✅ Tenant encontrado por nombre exacto:", tenantData.name);
      }
    }

    // ==========================================================
    // 2️⃣ Si no existe, buscar por dominio
    // ==========================================================
    if (!tenantData && origin && typeof origin === "string") {
      try {
        const parsedUrl = new URL(origin);
        const baseDomain = parsedUrl.hostname.replace(/^www\./, "");
        const pathSegment = parsedUrl.pathname?.split("/").filter(Boolean)[0] || "";

        const domainFilters = [];
        if (origin) domainFilters.push({ domains: { $in: [origin] } });
        if (baseDomain) domainFilters.push({ domains: { $elemMatch: { $regex: baseDomain, $options: "i" } } });
        if (pathSegment) domainFilters.push({ domains: { $elemMatch: { $regex: pathSegment, $options: "i" } } });

        console.log("🌍 domainFilters usados:", domainFilters);

        tenantData = await Tenant.findOne({ $or: domainFilters, active: true });
        if (tenantData) {
          console.log("✅ Tenant encontrado por dominio:", tenantData.name);
        }
      } catch (err) {
        console.warn("⚠️ Error interpretando origen:", origin, err.message);
      }
    }

    // ==========================================================
    // 3️⃣ Si aún no hay tenant, buscar por instrucciones
    // ==========================================================
    if (!tenantData) {
      console.warn(`⚠️ Tenant no encontrado (${tenant}), verificando instrucciones...`);
      const existingInstructions = await Instruction.find({ tenant });
      if (existingInstructions.length > 0) {
        console.log(`✅ Tenant detectado por coincidencia en instrucciones: ${tenant}`);
        tenantData = { name: tenant, active: true };
      }
    }

    // ==========================================================
    // 4️⃣ Fallback final: usar "default"
    // ==========================================================
    if (!tenantData) {
      console.warn(`⚠️ Ningún tenant coincide. Aplicando fallback 'default'`);
      tenantData = await Tenant.findOne({ name: "default" });
      tenant = "default";
    } else {
      tenant = tenantData.name;
    }

    console.log(`✅ Tenant detectado o asignado: ${tenant}`);

    // ==========================================================
    // 5️⃣ Control de uso por tenant y global
    // ==========================================================
    let usage = await Usage.findOne({ tenant });
    if (!usage) usage = await Usage.create({ tenant });

    let globalUsage = await GlobalUsage.findOne();
    if (!globalUsage) globalUsage = await GlobalUsage.create({ totalMessages: 0, limit: GLOBAL_LIMIT });

    const now = new Date();
    const daysSinceReset = (now - usage.lastReset) / (1000 * 60 * 60 * 24);
    if (daysSinceReset > 30) {
      usage.totalMessages = 0;
      usage.lastReset = now;
    }

    const daysSinceGlobalReset = (now - globalUsage.lastReset) / (1000 * 60 * 60 * 24);
    if (daysSinceGlobalReset > 30) {
      globalUsage.totalMessages = 0;
      globalUsage.lastReset = now;
    }

    if (globalUsage.totalMessages >= GLOBAL_LIMIT) {
      return res.status(429).json({
        reply: "⚠️ El chatbot ha alcanzado el límite global de interacciones. Inténtalo más tarde.",
      });
    }

    // ==========================================================
    // 6️⃣ Instrucciones específicas del tenant
    // ==========================================================
    const tenantInstructions = tenantData ? await Instruction.find({ tenant: tenantData.name }) : [];
    const instructionTexts = tenantInstructions.map((i) => i.text);

    console.log(`📘 Instrucciones cargadas para ${tenant}:`, instructionTexts);

    // ==========================================================
    // 7️⃣ Generar respuesta
    // ==========================================================
    const reply = await generateChatbotReply(message, instructionTexts, tenantData, language);

    // ==========================================================
    // 8️⃣ Guardar mensaje e incrementar contadores
    // ==========================================================
    await Message.create({
      tenant,
      message,
      reply,
      pageUrl,
      language,
      source,
      createdAt: new Date(),
    });

    usage.totalMessages += 1;
    globalUsage.totalMessages += 1;
    await usage.save();
    await globalUsage.save();

    res.json({ reply });

  } catch (error) {
    console.error("❌ Error en handleChatMessage:", error);
    res.status(500).json({ error: "Error interno del chatbot" });
  }
};
