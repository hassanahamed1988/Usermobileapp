const { GoogleGenAI } = require("@google/genai");

async function run() {
  try {
    // Force ADC by setting GoogleAuth environment
    process.env.GOOGLE_APPLICATION_CREDENTIALS = "/tmp/fake.json";
    const ai = new GoogleGenAI({ apiKey: "AIzaSyDummy" });
    await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hello"
    });
  } catch (e) {
    console.log("ERROR MESSAGE:", e.message);
  }
}
run();
