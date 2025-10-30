import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
import Tenant from "../models/Tenant.js"; // 👈 añadimos el modelo

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ No se encontró OPENAI_API_KEY. Verifica tu archivo .env");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Genera la respuesta del chatbot usando OpenAI.
 * Si el tenant existe, usa su prompt y configuración personalizada.
 */
// export async function generateChatbotReply(userMessage, tenantName = "default", context = null) {
//   try {
//     // 🔍 Buscar configuración del tenant
//     const tenant = await Tenant.findOne({ name: tenantName, active: true });

//     // Si no existe, usar valores por defecto
//     // 🧠 Prompt más contextualizado
//     const promptBase =
//       tenant?.prompt ||
//       "Eres el asistente oficial de un parque temático. Ofreces información sobre horarios, precios, atracciones y servicios. Sé breve (máx. 3 frases).";

//     const language = tenant?.language || "es";

//     // 💬 Mensajes enviados a OpenAI
//     const messages = [
//       {
//         role: "system",
//         content: `${promptBase} Tu nombre es ${tenant?.name || "NeuronicBot"}. Responde SIEMPRE en ${language}.`,
//       },
//       ...(context ? [{ role: "assistant", content: context }] : []),
//       { role: "user", content: userMessage },
//     ];


//     const completion = await client.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages,
//       temperature: 0.7,
//       max_tokens: 150, // 300,
//     });

//     const reply = completion.choices[0].message.content;

//     // 🧠 Si el tenant tiene límite de mensajes, podrías sumar un contador aquí (lo haremos luego)
//     return reply;
//   } catch (err) {
//     console.error("❌ Error generando respuesta:", err);
//     return "Hubo un error al generar la respuesta del asistente.";
//   }
// }

export async function generateChatbotReply(userMessage, context = null, tenant = null, languageFromBody = null) {
  try {
    const language = languageFromBody || tenant?.language || "es";

    const promptBase =
      tenant?.prompt ||
      `Eres el asistente oficial de ${tenant?.name || "un parque temático"}.
       Ofreces información sobre horarios, precios, atracciones y servicios.
       Sé breve (máx. 3 frases).`;

    const messages = [
      {
        role: "system",
        content: `${promptBase} 
        Tu nombre es ${tenant?.name || "NeuronicBot"}.
        Responde SIEMPRE en ${language}.`,
      },
      ...(context ? [{ role: "assistant", content: context }] : []),
      { role: "user", content: userMessage },
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 150,
    });

    return completion.choices[0].message.content;
  } catch (err) {
    console.error("❌ Error generando respuesta:", err);
    return "Hubo un error al generar la respuesta del asistente.";
  }
}
