var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "gen-lang-client-0792514696",
  appId: "1:606498539967:web:1ade816267853908e5b90a",
  apiKey: "AIzaSyBwI0Eu-gHOU16KDT5bBAl_-LO6K3ruBTU",
  authDomain: "gen-lang-client-0792514696.firebaseapp.com",
  firestoreDatabaseId: "fleetpromanager",
  storageBucket: "gen-lang-client-0792514696.firebasestorage.app",
  messagingSenderId: "606498539967",
  measurementId: "",
  oAuthClientId: "606498539967-661f1dp7al1ta8qhi2vgkvb85jrhccck.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// server.ts
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "20mb" }));
  app.use(import_express.default.urlencoded({ limit: "20mb", extended: true }));
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });
  app.post("/api/auth/create-user", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }
      const apiKey = firebase_applet_config_default.apiKey;
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
      const signUpRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: false })
      });
      const data = await signUpRes.json();
      if (!signUpRes.ok) {
        if (data.error && data.error.message === "EMAIL_EXISTS") {
          console.log("User already exists in Firebase Auth. Continuing without update.");
          res.json({ success: true, message: "User already exists in Firebase Auth. Password not updated." });
          return;
        }
        res.status(400).json({ error: data.error?.message || "Failed to create user" });
        return;
      }
      console.log("Successfully created user in Firebase Auth via REST API:", data.localId);
      res.json({ success: true, uid: data.localId });
    } catch (error) {
      console.error("Server error during /api/auth/create-user:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/auth/update-password", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }
      console.log(`Mocking password update for ${email} because Admin SDK is not configured with Service Account.`);
      res.json({ success: true, mocked: true });
    } catch (error) {
      console.error("Error updating user password:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/ocr", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        res.status(400).json({ error: "Image data is required" });
        return;
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
        return;
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
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
          mimeType,
          data: cleanBase64
        }
      };
      const prompt = `Extract structured delivery context from this TRIP SHEET / DELIVERY NOTE document. 
Identify handwritten or printed text accurately.
Follow these extraction maps strictly:
- "No." label content (located at the top right, e.g., "90450/1") \u2794 invoiceNumber
- "Company Name" label content \u2794 companyName (e.g. "FedEx Qatar" if printed. Keep matches clean)
- "Doc. No." label content \u2794 bayanNumber (e.g. "5SI60041242560")
- "Truck No." label content \u2794 truckNumber (e.g. "257086")
- "Container No." label content \u2794 containerNumber (e.g. "TTNU 8702418")
- "Consignee Location" label content: Split the location by the word "to" (case-insensitive):
  - Extract only the substring BEFORE "to" (e.g. "Hamad Port" from "Hamad Port to Sanaiya"). Trim it. \u2794 loadingPlace.
  - Extract only the substring AFTER "to" (e.g. "Sanaiya" from "Hamad Port to Sanaiya"). Trim it. \u2794 deliveryPlace.
- "Port Enter Time":
  - "Date" \u2794 loadingDate (Format as YYYY-MM-DD. E.g., 13-06-2026 becomes 2026-06-13. If blank or empty or not present in Port Enter Time columns, return "".)
  - "Time" \u2794 loadingTime (Format as HH:mm. E.g. "14:30". If blank or not present, return "".)
- "TRAILER EXIT" under Shipment delivery details table (the right-most Exit columns):
  - "Date" \u2794 deliveryDate (Format as YYYY-MM-DD. E.g., 14-06-2026 yields 2026-06-14. If blank or not present, return "".)
  - "Time" \u2794 deliveryTime (Format as HH:mm. If blank or not present, return "".)

CRITICAL: If any field is physically blank, empty, unwritten, or missing in the document, you MUST set that field to "" (empty string). Do NOT invent, assume, simulate, or guess metadata. Be absolute and accurate. Only fill fields where written or printed content exists.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [imagePart, { text: prompt }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              invoiceNumber: { type: import_genai.Type.STRING, description: "Extracted No. / Invoice Number. Empty string if not found." },
              companyName: { type: import_genai.Type.STRING, description: "Extracted Company Name. Empty string if not found." },
              bayanNumber: { type: import_genai.Type.STRING, description: "Extracted Doc. No. / Bayan number. Empty string if not found." },
              truckNumber: { type: import_genai.Type.STRING, description: "Extracted Truck No. Empty string if not found." },
              containerNumber: { type: import_genai.Type.STRING, description: "Extracted Container No. Empty string if not found." },
              loadingPlace: { type: import_genai.Type.STRING, description: "Extracted location fraction before 'to'. Empty string if not found." },
              deliveryPlace: { type: import_genai.Type.STRING, description: "Extracted location fraction after 'to'. Empty string if not found." },
              loadingDate: { type: import_genai.Type.STRING, description: "Port entering Date formatted YYYY-MM-DD. Empty string if not found." },
              loadingTime: { type: import_genai.Type.STRING, description: "Port entering Time formatted HH:mm. Empty string if not found." },
              deliveryDate: { type: import_genai.Type.STRING, description: "Trailer exit Date formatted YYYY-MM-DD. Empty string if not found." },
              deliveryTime: { type: import_genai.Type.STRING, description: "Trailer exit Time formatted HH:mm. Empty string if not found." }
            },
            required: [
              "invoiceNumber",
              "companyName",
              "bayanNumber",
              "truckNumber",
              "containerNumber",
              "loadingPlace",
              "deliveryPlace",
              "loadingDate",
              "loadingTime",
              "deliveryDate",
              "deliveryTime"
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
  app.post("/api/purchase-ocr", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        res.status(400).json({ error: "Image data is required" });
        return;
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
        return;
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
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
          mimeType,
          data: cleanBase64
        }
      };
      const prompt = `Extract structured data from this Purchase Receipt.
Extract the hypermarket/supermarket name.
Extract the list of items purchased. For each item, extract its name, price, quantity (number), and unit (KG, Gram, Piece, etc. Convert to standard words if possible).
If price or quantity is missing, estimate it from the total or return what is available.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [imagePart, { text: prompt }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              hypermarketName: { type: import_genai.Type.STRING, description: "Extracted Supermarket / Hypermarket Name. Empty string if not found." },
              items: {
                type: import_genai.Type.ARRAY,
                description: "List of extracted purchase items.",
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    name: { type: import_genai.Type.STRING, description: "Item name" },
                    price: { type: import_genai.Type.NUMBER, description: "Item price per unit or total price if unit price not clear. Number only." },
                    quantity: { type: import_genai.Type.NUMBER, description: "Quantity of the item. Number only." },
                    unit: { type: import_genai.Type.STRING, description: "Unit of the quantity (e.g., 'KG', 'Gram', 'Piece', 'Litre')." }
                  },
                  required: ["name", "price", "quantity", "unit"]
                }
              }
            },
            required: ["hypermarketName", "items"]
          }
        }
      });
      const resultText = response.text || "{}";
      const parsedData = JSON.parse(resultText.trim());
      res.json(parsedData);
    } catch (error) {
      console.error("Purchase OCR API Error on Server:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, systemInstruction } = req.body;
      if (!message) {
        res.status(400).json({ error: "Message is required" });
        return;
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
        return;
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: message,
        config: systemInstruction ? { systemInstruction } : void 0
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error("Gemini API Error on Server:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });
  app.use("/api", (err, req, res, next) => {
    console.error("API Error middleware caught:", err);
    res.status(err.status || 500).json({ error: err.message || "Unknown API Error" });
  });
  app.use("/api", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
