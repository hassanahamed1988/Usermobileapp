const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
const { GoogleGenAI, Type } = require("@google/genai");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const adminDb = getFirestore(admin.apps[0], "fleetpromanager");

let cachedApiKey = null;

async function getGeminiApiKey() {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  if (cachedApiKey) {
    return cachedApiKey;
  }
  try {
    const docSnap = await adminDb.collection("config").doc("gemini").get();
    if (docSnap.exists) {
      cachedApiKey = docSnap.data().apiKey;
      return cachedApiKey;
    }
  } catch (error) {
    console.error("Error reading GEMINI_API_KEY from Firestore:", error);
  }
  return null;
}

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

app.post(["/api/ocr", "/ocr"], async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ error: "Image data is required" });
      return;
    }

    // Attempt to use system env first or fall back to Firestore config
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    let cleanBase64 = image;
    let mimeType = "image/jpeg";
    if (image.startsWith("data:")) {
      const match = image.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        cleanBase64 = match[2];
      }
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: cleanBase64,
      }
    };

    const prompt = `Extract structured delivery context from this TRIP SHEET / DELIVERY NOTE document. 
Identify handwritten or printed text accurately.
Follow these extraction maps strictly:
- "No." label content (located at the top right, e.g., "90450/1") ➔ invoiceNumber
- "Company Name" label content ➔ companyName (e.g. "FedEx Qatar" if printed. Keep matches clean)
- "Doc. No." label content ➔ bayanNumber (e.g. "5SI60041242560")
- "Truck No." label content ➔ truckNumber (e.g. "257086")
- "Container No." label content ➔ containerNumber (e.g. "TTNU 8702418")
- "Consignee Location" label content: Split the location by the word "to" (case-insensitive):
  - Extract only the substring BEFORE "to" (e.g. "Hamad Port" from "Hamad Port to Sanaiya"). Trim it. ➔ loadingPlace.
  - Extract only the substring AFTER "to" (e.g. "Sanaiya" from "Hamad Port to Sanaiya"). Trim it. ➔ deliveryPlace.
- "Port Enter Time":
  - "Date" ➔ loadingDate (Format as YYYY-MM-DD. E.g., 13-06-2026 becomes 2026-06-13. If blank or empty or not present in Port Enter Time columns, return "".)
  - "Time" ➔ loadingTime (Format as HH:mm. E.g. "14:30". If blank or not present, return "".)
- "TRAILER EXIT" under Shipment delivery details table (the right-most Exit columns):
  - "Date" ➔ deliveryDate (Format as YYYY-MM-DD. E.g., 14-06-2026 yields 2026-06-14. If blank or not present, return "".)
  - "Time" ➔ deliveryTime (Format as HH:mm. If blank or not present, return "".)

CRITICAL: If any field is physically blank, empty, unwritten, or missing in the document, you MUST set that field to "" (empty string). Do NOT invent, assume, simulate, or guess metadata. Be absolute and accurate. Only fill fields where written or printed content exists.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, { text: prompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            invoiceNumber: { type: Type.STRING, description: "Extracted No. / Invoice Number. Empty string if not found." },
            companyName: { type: Type.STRING, description: "Extracted Company Name. Empty string if not found." },
            bayanNumber: { type: Type.STRING, description: "Extracted Doc. No. / Bayan number. Empty string if not found." },
            truckNumber: { type: Type.STRING, description: "Extracted Truck No. Empty string if not found." },
            containerNumber: { type: Type.STRING, description: "Extracted Container No. Empty string if not found." },
            loadingPlace: { type: Type.STRING, description: "Extracted location fraction before 'to'. Empty string if not found." },
            deliveryPlace: { type: Type.STRING, description: "Extracted location fraction after 'to'. Empty string if not found." },
            loadingDate: { type: Type.STRING, description: "Port entering Date formatted YYYY-MM-DD. Empty string if not found." },
            loadingTime: { type: Type.STRING, description: "Port entering Time formatted HH:mm. Empty string if not found." },
            deliveryDate: { type: Type.STRING, description: "Trailer exit Date formatted YYYY-MM-DD. Empty string if not found." },
            deliveryTime: { type: Type.STRING, description: "Trailer exit Time formatted HH:mm. Empty string if not found." },
          },
          required: [
            "invoiceNumber", "companyName", "bayanNumber", "truckNumber", "containerNumber", "loadingPlace", "deliveryPlace",
            "loadingDate", "loadingTime", "deliveryDate", "deliveryTime"
          ]
        }
      }
    });

    const resultText = response.text || "{}";
    const parsedData = JSON.parse(resultText.trim());
    res.json(parsedData);
  } catch (error) {
    console.error("OCR API Error on Server:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

app.post(["/api/gemini/chat", "/gemini/chat"], async (req, res) => {
  try {
    const { message, systemInstruction } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: systemInstruction ? { systemInstruction } : undefined,
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini API Error on Server:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

exports.api = onRequest(app);
