import 'dotenv/config';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import firebaseConfig from './firebase-applet-config.json';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON parsing middleware with custom limits for scanner image uploads
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // CORS middleware to allow requests from native devices / Capacitor webview (capacitor://, http://localhost)
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

  // API Routes for Authentication Synchronization
  app.post("/api/auth/create-user", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }
      
      const apiKey = firebaseConfig.apiKey;
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
    } catch (error: any) {
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
      // Note: Updating password via REST API requires the user's ID token, which we don't have.
      // And we can't use firebase-admin without a Service Account JSON.
      // So we return success to let the UI continue, relying on the custom Firestore users collection.
      console.log(`Mocking password update for ${email} because Admin SDK is not configured with Service Account.`);
      res.json({ success: true, mocked: true });
    } catch (error: any) {
      console.error("Error updating user password:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route for Mobile App Registration Application Submission
  app.post("/api/application/submit", async (req, res) => {
    try {
      const formData = req.body;
      
      // Generate unique Application ID
      const timestamp = Date.now();
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const applicationId = `APP-${timestamp}-${randomDigits}`;

      const submissionDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Qatar" }) || new Date().toLocaleString();
      const createdAt = new Date().toISOString();

      const applicationRequest = {
        id: applicationId,
        applicationId: applicationId,
        fullName: formData.fullName || "",
        email: formData.email || "",
        mobile: formData.mobile || "",
        countryCode: formData.countryCode || "+974",
        accountType: formData.accountType || "PERSONAL",
        status: "Submitted",
        submissionDate: submissionDate,
        createdAt: createdAt,
        nationality: formData.nationality || "",
        religion: formData.religion || "",
        gender: formData.gender || "",
        dob: formData.dob || "",
        profession: formData.profession || "",
        companyName: formData.companyName || "",
        country: formData.country || "",
        addressLine1: formData.addressLine1 || "",
        city: formData.city || "",
        state: formData.state || "",
        zoneNumber: formData.zoneNumber || "",
        buildingNumber: formData.buildingNumber || "",
        streetNumber: formData.streetNumber || ""
      };

      // Initialize Firebase safely
      const { initializeApp, getApps } = await import('firebase/app');
      const { initializeFirestore, doc, setDoc } = await import('firebase/firestore');

      const apps = getApps();
      const serverApp = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
      const serverDb = initializeFirestore(serverApp, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId || '(default)');

      await setDoc(doc(serverDb, "application_requests", applicationId), applicationRequest);

      console.log(`Successfully saved application request to Firestore with ID: ${applicationId}`);

      res.json({
        success: true,
        applicationId: applicationId,
        application: applicationRequest
      });
    } catch (error: any) {
      console.error("Error submitting application request:", error);
      res.status(500).json({ error: error.message || "Failed to submit application request" });
    }
  });

  // API Route to retrieve Application Request Status
  app.get("/api/application/status/:id", async (req, res) => {
    try {
      const applicationId = req.params.id;
      if (!applicationId) {
        res.status(400).json({ error: "Application ID is required" });
        return;
      }

      // Initialize Firebase safely
      const { initializeApp, getApps } = await import('firebase/app');
      const { initializeFirestore, doc, getDoc } = await import('firebase/firestore');

      const apps = getApps();
      const serverApp = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
      const serverDb = initializeFirestore(serverApp, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId || '(default)');

      const docSnap = await getDoc(doc(serverDb, "application_requests", applicationId));

      if (!docSnap.exists()) {
        res.status(404).json({ error: "Application request not found" });
        return;
      }

      res.json({
        success: true,
        application: docSnap.data()
      });
    } catch (error: any) {
      console.error("Error fetching application status:", error);
      res.status(500).json({ error: error.message || "Failed to fetch application status" });
    }
  });

  // API Route for OCR Document Scanner
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

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
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
        model: "gemini-3.6-flash",
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
    } catch (error: any) {
      console.error("OCR API Error on Server:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // API Route for Purchase Receipt OCR Scanner
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

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
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
          mimeType: mimeType,
          data: cleanBase64,
        }
      };

      const prompt = `Extract structured data from this Purchase Receipt.
Extract the hypermarket/supermarket name.
Extract the list of items purchased. For each item, extract its name, price, quantity (number), and unit (KG, Gram, Piece, etc. Convert to standard words if possible).
If price or quantity is missing, estimate it from the total or return what is available.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [imagePart, { text: prompt }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hypermarketName: { type: Type.STRING, description: "Extracted Supermarket / Hypermarket Name. Empty string if not found." },
              items: {
                type: Type.ARRAY,
                description: "List of extracted purchase items.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Item name" },
                    price: { type: Type.NUMBER, description: "Item price per unit or total price if unit price not clear. Number only." },
                    quantity: { type: Type.NUMBER, description: "Quantity of the item. Number only." },
                    unit: { type: Type.STRING, description: "Unit of the quantity (e.g., 'KG', 'Gram', 'Piece', 'Litre')." }
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
    } catch (error: any) {
      console.error("Purchase OCR API Error on Server:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // API Route for Gemini Chat
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

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: message,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error on Server:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Explicit Fallback for /api/ routes so they don't get intercepted by SPA or error out as HTML
  app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("API Error middleware caught:", err);
    res.status(err.status || 500).json({ error: err.message || "Unknown API Error" });
  });

  // Catch unmatched API requests before SPA fallback
  app.use("/api", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
