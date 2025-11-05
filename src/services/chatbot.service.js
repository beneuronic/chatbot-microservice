import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
import Tenant from "../models/Tenant.js";
import Instruction from "../models/Instruction.js"; // 👈 necesario
import { buildContextFromKnowledge } from "./context.service.js";



if (!process.env.OPENAI_API_KEY) {
  console.error("❌ No se encontró OPENAI_API_KEY. Verifica tu archivo .env");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Genera la respuesta del chatbot usando OpenAI.
 * Incluye el prompt del tenant + instrucciones específicas desde MongoDB.
 */
export async function generateChatbotReply(
  userMessage,
  instructions = [],
  tenant = null,
  languageFromBody = null
) {
  try {
    // 🔒 Siempre aseguramos que 'instructions' sea un array
    const safeInstructions = Array.isArray(instructions) ? instructions : [];

    // 🧠 Determinar idioma
    const language = languageFromBody || tenant?.language || "es";

    // 📋 Prompt base del tenant
    const promptBase =
      tenant?.prompt ||
      `Eres el asistente oficial de ${tenant?.name || "un parque temático"}.
       Ofreces información sobre horarios, precios, atracciones y servicios.
       Sé breve (máx. 3 frases).`;

    // 🧠 Obtener contexto desde WordPress (knowledge sync)
    const knowledgeContext = await buildContextFromKnowledge(tenant);
    console.log("📘 Contexto extraído desde páginas autorizadas:\n", knowledgeContext?.slice(0, 500));


    // 🧩 Combinar instrucciones del tenant (si existen)
    const combinedInstructions = safeInstructions.length
      ? `\nSigue estas instrucciones adicionales:\n- ${safeInstructions.join("\n- ")}`
      : "";

    // 💬 Construir el prompt final
    const fullSystemPrompt = `${promptBase}${combinedInstructions}
    Tu apodo es ${tenant?.name || "NeuronicBot"}.
    Responde SIEMPRE en ${language}.
       // 🧠 Obtener contexto desde WordPress (knowledge sync)
    const knowledgeContext = await buildContextFromKnowledge(tenant);
    console.log("📘 Contexto extraído desde páginas autorizadas:\n", knowledgeContext?.slice(0, 500));
    `;

    // 🪶 Log de depuración (verás esto en tu terminal)
    console.log("🧩 SYSTEM PROMPT ENVIADO A OPENAI:\n", fullSystemPrompt, "\n");

    // 🗣️ Mensajes enviados a OpenAI
    // const messages = [
    //   { role: "system", content: fullSystemPrompt },
    //   { role: "user", content: userMessage },
    // ];
    // 🗣️ Mensajes enviados a OpenAI
    const messages = [
      { role: "system", content: promptBase.trim() },
      ...safeInstructions.map(text => ({
        role: "system",
        content: text.trim(),
      })),
      {
        role: "system",
        content: `Tu apodo es ${tenant?.name || "NeuronicBot"}.
                  Responde SIEMPRE en ${language}. Sé educado y útil.`,
      },
      { role: "user", content: userMessage },
    ];
console.log("🔍 safeInstructions:", safeInstructions);
console.log("🔍 tenant:", tenant?.name);
console.log("🔍 promptBase:", promptBase);


    // 🚀 Llamada a OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: tenant?.temperature || 0.7,
      max_tokens: 200,
    });

    // ✅ Respuesta limpia
    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.error("❌ Error generando respuesta:", err);
    return "Hubo un error al generar la respuesta del asistente.";
  }
}
