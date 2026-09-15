const { GoogleGenAI } = require("@google/genai");

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: " " });
    await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hello"
    });
  } catch (e) {
    console.log("ERROR MESSAGE:", e.message);
  }
}
run();
