import Message from "../models/Message.js";
import { generateChatbotReply } from "../services/chatbot.service.js";

export const handleChatMessage = async (req, res) => {
  try {
    const { message, tenant = "default" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Mensaje vacío" });
    }

    // Guardar el mensaje del usuario
    const userMsg = await Message.create({ tenant, message });

    // Obtener respuesta de OpenAI
    const reply = await generateChatbotReply(message);

    // Guardar la respuesta
    userMsg.reply = reply;
    await userMsg.save();

    res.json({ reply });
  } catch (error) {
    console.error("❌ Error en handleChatMessage:", error);
    res.status(500).json({ error: "Error interno del chatbot" });
  }
};
