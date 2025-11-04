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

    // 🌐 Detección de tenant (por body o dominio Referer/Origin)
    const origin = req.get("origin") || req.get("referer") || "";
    let tenantData = null;

    console.log("🧠 tenant recibido:", tenant);
    console.log("🌍 origin header:", origin || "(vacío)");

    // --- Construir filtros de dominio robustos ---
    let domainFilters = [];
    try {
      if (origin) {
        const parsedUrl = new URL(origin);
        const baseDomain = parsedUrl.hostname.replace(/^www\./, "");
        const pathSegmentRaw = parsedUrl.pathname?.split("/").filter(Boolean)[0];
        const pathSegment = typeof pathSegmentRaw === "string" ? pathSegmentRaw : "";

        domainFilters = [
          { domains: { $in: [origin] } },
          { domains: { $regex: baseDomain, $options: "i" } },
          { domains: { $regex: pathSegment, $options: "i" } },
        ];
      }
    } catch (err) {
      console.warn("⚠️ Error interpretando origen:", origin, err.message);
    }

    console.log("🧱 domainFilters antes de Tenant.findOne:", domainFilters);

    // --- Buscar Tenant por nombre o dominio ---
    tenantData = await Tenant.findOne({
      $or: [{ name: tenant }, ...domainFilters],
      active: true,
    });

    console.log("🧩 Resultado Tenant.findOne:", tenantData);
    console.log("🔍 tenant recibido en body:", tenant);
    console.log("🔍 dominios detectados desde origin:", origin);
    console.log("🔍 tenantData encontrado:", tenantData ? tenantData.name : "❌ ninguno");

    // --- Si no se encuentra, intentar fallback ---
    if (!tenantData) {
        console.log("🔍 Detalle tenantData:", {

      console.warn(`⚠️ Tenant no encontrado (${origin}), verificando instrucciones para '${tenant}'...`);
      const existingInstructions = await Instruction.find({ tenant });

      if (existingInstructions.length > 0) {
        console.log(`✅ Tenant detectado por instrucciones: ${tenant}`);
        tenantData = { name: tenant, active: true }; // objeto temporal simulado
      } else {
        console.warn(`⚠️ Tampoco hay instrucciones para '${tenant}', aplicando 'default'`);
        tenantData = await Tenant.findOne({ name: "default" });
        tenant = "default";
      }
    } else {
      tenant = tenantData?.name || tenant;
    }

    console.log(`✅ Tenant detectado o asignado: ${tenant}`);

    // --- Obtener o crear registros de uso ---
    let usage = await Usage.findOne({ tenant });
    if (!usage) usage = await Usage.create({ tenant });

    let globalUsage = await GlobalUsage.findOne();
    if (!globalUsage)
      globalUsage = await GlobalUsage.create({ totalMessages: 0, limit: GLOBAL_LIMIT });

    // --- Reset mensual ---
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

    // --- Comprobar límites ---
    if (globalUsage.totalMessages >= GLOBAL_LIMIT) {
      return res.status(429).json({
        reply: "⚠️ El chatbot ha alcanzado el límite global de interacciones. Inténtalo más tarde.",
      });
    }

    // --- Obtener instrucciones del tenant ---
    const tenantInstructions = tenantData
      ? await Instruction.find({ tenant: tenantData.name })
      : [];

    const instructionTexts = tenantInstructions.map((i) => i.text);
    console.log(`📘 Instrucciones cargadas para ${tenant}:`, instructionTexts);

    // --- Generar respuesta ---
    const reply = await generateChatbotReply(message, instructionTexts, tenantData, language);

    // --- Guardar mensaje ---
    await Message.create({
      tenant,
      message,
      reply,
      pageUrl,
      language,
      source,
      createdAt: new Date(),
    });

    // --- Incrementar contadores ---
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
