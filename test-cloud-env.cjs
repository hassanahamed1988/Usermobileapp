const { GoogleGenAI } = require("@google/genai");
async function run() {
  try {
    process.env.K_SERVICE = "api"; // Simulate Cloud Run
    process.env.GOOGLE_CLOUD_PROJECT = "fleetpromanager";
    const ai = new GoogleGenAI({ apiKey: "AIzaSyDummyDummyDummyDummyDummyDummyDummy" });
    await ai.models.generateContent({ model: "gemini-3.5-flash", contents: "Hello" });
  } catch (e) { console.log("ERROR:", e.message); }
}
run();
