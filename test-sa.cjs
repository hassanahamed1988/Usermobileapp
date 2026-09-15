const { GoogleGenAI } = require("@google/genai");
async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: '{"type":"service_account"}' });
    await ai.models.generateContent({ model: "gemini-3.5-flash", contents: "Hello" });
  } catch (e) { console.log("ERROR:", e.message); }
}
run();
