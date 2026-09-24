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

async function getGeminiApiKey(requestedKey) {
  if (requestedKey && String(requestedKey).trim()) {
    return String(requestedKey).trim();
  }
  try {
    const docSnap = await adminDb.collection("config").doc("gemini").get();
    if (docSnap.exists) {
      const dbKey = docSnap.data().apiKey;
      if (dbKey && dbKey.trim()) {
        cachedApiKey = dbKey.trim();
        return cachedApiKey;
      }
    }
  } catch (error) {
    console.error("Error reading GEMINI_API_KEY from Firestore:", error);
  }
  if (cachedApiKey) {
    return cachedApiKey;
  }
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  return null;
}

// Helper to run content generation with model fallbacks to prevent 503 errors
async function generateWithFallback(ai, contents, config) {
  const candidateModels = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.8-flash"
  ];

  let lastError = null;
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      return response;
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} failed with ${err?.status || err?.message}, trying fallback...`);
    }
  }
  throw lastError;
}

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

app.post(["/api/ocr", "/ocr"], async (req, res) => {
  try {
    const { image, apiKey: clientApiKey } = req.body;
    if (!image) {
      res.status(400).json({ error: "Image data is required" });
      return;
    }

    // Attempt to use requested key, Firestore config, or system env
    const apiKey = await getGeminiApiKey(clientApiKey);
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

    const response = await generateWithFallback(
      ai,
      [imagePart, { text: prompt }],
      {
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
    );

    const resultText = response.text || "{}";
    const parsedData = JSON.parse(resultText.trim());
    res.json(parsedData);
  } catch (error) {
    console.error("OCR API Error on Server:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

app.post(["/api/diesel-ocr", "/diesel-ocr"], async (req, res) => {
  try {
    const { image, apiKey: clientApiKey } = req.body;
    if (!image) {
      res.status(400).json({ error: "Image data is required" });
      return;
    }

    const apiKey = await getGeminiApiKey(clientApiKey);
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

    const prompt = `Extract structured data from this Diesel/Fuel Receipt.
Identify values correctly:
1. "Pump Name" or supplier/station name (e.g., "WOQOD" or "Bu Sulba" or "WOQOD - Bu Sulba"). Maximize accuracy. ➔ pumpName
2. "Fuel Quantity" or volume in Liters (e.g., 24.39). Convert to number/string. ➔ fuelQuantity
3. "Unit Price" or cost per Liter (e.g., 2.05). Convert to number/string. ➔ unitPrice
4. "Amount" or total amount/cost paid (e.g., 50). Convert to number/string. ➔ generatorDiesel
5. "Receipt Number" or invoice/receipt No. (e.g., "249278"). ➔ generatorReceiveNumber
6. "Receipt Date" ➔ Extract the EXACT raw date string as written or printed on the receipt, preserving its original format (e.g., "17/09/2026" or "17-09-2026" or "17-Sep-2026"). Do NOT convert or normalize. ➔ dieselReceiptDate
7. "Receipt Time" ➔ Extract the EXACT raw time string as written or printed on the receipt, preserving its original format (e.g., "17:06:53" or "17:06" or "05:06 PM"). Do NOT convert or normalize. ➔ dieselReceiptTime
8. Classify the "Diesel Type" depending on the receipt details. Default to "generator" unless "truck" or other is clear. ➔ dieselReceiptType

CRITICAL: If any field is physically blank or not found, return empty string.`;

    const response = await generateWithFallback(
      ai,
      [imagePart, { text: prompt }],
      {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pumpName: { type: Type.STRING, description: "Extracted Pump Station / Supplier Name. Empty string if not found." },
            fuelQuantity: { type: Type.STRING, description: "Extracted fuel quantity in Liters (e.g., '24.39'). Empty string if not found." },
            unitPrice: { type: Type.STRING, description: "Extracted unit price (e.g., '2.05'). Empty string if not found." },
            generatorDiesel: { type: Type.STRING, description: "Extracted total amount (e.g., '50'). Empty string if not found." },
            generatorReceiveNumber: { type: Type.STRING, description: "Extracted receipt number. Empty string if not found." },
            dieselReceiptDate: { type: Type.STRING, description: "Extracted receipt Date in its exact original raw format from the receipt. Empty string if not found." },
            dieselReceiptTime: { type: Type.STRING, description: "Extracted receipt Time in its exact original raw format from the receipt. Empty string if not found." },
            dieselReceiptType: { type: Type.STRING, description: "Classification: 'truck', 'generator', or 'light_vehicle'." },
          },
          required: ["pumpName", "fuelQuantity", "unitPrice", "generatorDiesel", "generatorReceiveNumber", "dieselReceiptDate", "dieselReceiptTime", "dieselReceiptType"]
        }
      }
    );

    const resultText = response.text || "{}";
    const parsedData = JSON.parse(resultText.trim());
    res.json(parsedData);
  } catch (error) {
    console.error("Diesel OCR API Error on Server:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

app.post(["/api/purchase-ocr", "/purchase-ocr"], async (req, res) => {
  try {
    const { image, apiKey: clientApiKey } = req.body;
    if (!image) {
      res.status(400).json({ error: "Image data is required" });
      return;
    }

    const apiKey = await getGeminiApiKey(clientApiKey);
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

    const prompt = `Extract structured data from this Purchase Receipt.
1. Extract the hypermarket/supermarket name.
2. Extract the purchase Date (formatted as YYYY-MM-DD, e.g. 2026-09-15) and purchase Time (formatted as HH:mm, e.g. 14:35) written on the receipt. If either is not found, return an empty string.
3. Extract the list of items purchased. For each item, you MUST calculate the normalized price per 1 standard unit (e.g. 1 KG, 1 Litre, or 1 Piece) based on the quantity and total amount listed on the receipt:
   - If the item's unit is Gram, calculate the price for 1 KG (1000 Grams): pricePerUnit = (totalAmount / quantity) * 1000. E.g., 500 Gram of Rice costing 12 QAR has a pricePerUnit of 24 QAR per KG.
   - If the item's unit is KG/Kilogram, calculate: pricePerUnit = totalAmount / quantity.
   - If the item's unit is ML, calculate the price for 1 Litre (1000 ML): pricePerUnit = (totalAmount / quantity) * 1000.
   - If the item's unit is Litre, calculate: pricePerUnit = totalAmount / quantity.
   - For other units like Piece, Pcs, Pack, Box, or Bottle, calculate the price for 1 single Piece: pricePerUnit = totalAmount / quantity. E.g. a pack of 3 costing 9 QAR has a pricePerUnit of 3 QAR.`;

    const response = await generateWithFallback(
      ai,
      [imagePart, { text: prompt }],
      {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hypermarketName: { type: Type.STRING, description: "Extracted Supermarket / Hypermarket Name. Empty string if not found." },
            date: { type: Type.STRING, description: "Extracted purchase date formatted as YYYY-MM-DD. Empty string if not found." },
            time: { type: Type.STRING, description: "Extracted purchase time formatted as HH:mm. Empty string if not found." },
            items: {
              type: Type.ARRAY,
              description: "List of extracted purchase items.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Item name" },
                  quantity: { type: Type.NUMBER, description: "Quantity of the item (e.g., 500 for Grams, 1.5 for KG, 2 for Pieces). Number only." },
                  unit: { type: Type.STRING, description: "Unit of the quantity (e.g., 'KG', 'Gram', 'Piece', 'Litre')." },
                  totalAmount: { type: Type.NUMBER, description: "The total amount/cost paid for this item in the receipt. Number only." },
                  pricePerUnit: { type: Type.NUMBER, description: "Calculated normalized price per 1 standard unit (1 KG, 1 Litre, or 1 Piece) based on totalAmount and quantity. Number only." }
                },
                required: ["name", "quantity", "unit", "totalAmount", "pricePerUnit"]
              }
            }
          },
          required: ["hypermarketName", "date", "time", "items"]
        }
      }
    );

    const resultText = response.text || "{}";
    const parsedData = JSON.parse(resultText.trim());
    res.json(parsedData);
  } catch (error) {
    console.error("Purchase OCR API Error on Server:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

app.post(["/api/gemini/chat", "/gemini/chat"], async (req, res) => {
  try {
    const { message, systemInstruction, apiKey: clientApiKey } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const apiKey = await getGeminiApiKey(clientApiKey);
    if (!apiKey) {
      res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    const response = await generateWithFallback(
      ai,
      message,
      systemInstruction ? { systemInstruction } : undefined
    );

    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini API Error on Server:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

exports.api = onRequest(app);
