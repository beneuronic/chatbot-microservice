import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateChatbotReply(userMessage, context = null) {
  try {
    const messages = [
      { role: "system", content: "Eres un asistente útil, amable y profesional desarrollado por Neuronic. Responde en el mismo idioma del usuario." },
      ...(context ? [{ role: "assistant", content: context }] : []),
      { role: "user", content: userMessage },
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 300,
    });

    return completion.choices[0].message.content;
  } catch (err) {
    console.error("❌ Error generando respuesta:", err);
    return "Hubo un error al generar la respuesta del asistente.";
  }
}
