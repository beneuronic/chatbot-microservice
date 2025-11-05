/**
 * Devuelve el contenido textual de las páginas definidas en el tenant
 * para usarlas como contexto del chatbot (sin depender de axios).
 */
export const buildContextFromKnowledge = async (tenantData) => {
  try {
    if (!tenantData.knowledge || !tenantData.knowledge.pages?.length) {
      return "No authorized pages found for this chatbot.";
    }

    const { pages, origin } = tenantData.knowledge;
    if (!origin) return "Missing origin domain for tenant knowledge.";

    const contexts = [];

    for (const pageId of pages) {
      try {
        const url = `${origin}/?p=${pageId}&cbm_plain=1`;

        // ✅ Usamos fetch nativo
        const response = await fetch(url, { timeout: 8000 });
        if (!response.ok) {
          console.error(`⚠️ Error fetching ${url}: ${response.status}`);
          continue;
        }

        const html = await response.text();

        // 🔹 Limpieza básica del HTML
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]*>?/gm, "")
          .replace(/\s+/g, " ")
          .trim();

        contexts.push(`=== Page ID ${pageId} ===\n${text}`);
      } catch (err) {
        console.error(`⚠️ Error fetching page ${pageId}:`, err.message);
      }
    }

    return contexts.length
      ? contexts.join("\n\n")
      : "No content could be retrieved from the authorized pages.";
  } catch (err) {
    console.error("❌ Error building context:", err);
    return "Error retrieving authorized content.";
  }
};
