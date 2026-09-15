const { GoogleGenAI } = require("@google/genai");
async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: "ya29.c.c0AYBY..." });
    await ai.models.generateContent({ model: "gemini-3.5-flash", contents: "Hello" });
  } catch (e) { console.log("ERROR:", e.message); }
}
run();
