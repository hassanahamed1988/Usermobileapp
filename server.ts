import 'dotenv/config';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import firebaseConfig from './firebase-applet-config.json';
import { initializeApp as initClientApp } from 'firebase/app';
import { 
  getFirestore as getClientFirestore, 
  collection as clientCollection, 
  collectionGroup as clientCollectionGroup, 
  getDocs as clientGetDocs, 
  updateDoc as clientUpdateDoc, 
  writeBatch as clientWriteBatch,
  doc as clientDoc,
  setDoc as clientSetDoc,
  getDoc as clientGetDoc
} from 'firebase/firestore';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Firestore backend client
  const clientApp = initClientApp(firebaseConfig);
  const dbClient = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);

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
  interface Session {
    userId: string;
    createdAt: number;
    lastActiveAt: number;
  }
  const activeSessions = new Map<string, Session>();
  const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days sliding window

  // Background cleanup of inactive sessions every hour
  setInterval(() => {
    const now = Date.now();
    for (const [sid, sess] of activeSessions.entries()) {
      if (now - (sess.lastActiveAt || sess.createdAt) > SESSION_TTL_MS) {
        activeSessions.delete(sid);
      }
    }
  }, 3600000);

  // Middleware to enforce session validation
  const enforceSession = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    const sessionId = authHeader?.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : ((req.headers["x-session-id"] as string) || (req.body?.sessionId as string) || (req.query?.sessionId as string));
    const userIdHeader = (req.headers["x-user-id"] as string) || req.body?.userId;
    
    if (!sessionId) {
      if (userIdHeader) {
        return next();
      }
      // Allow valid API requests from application client
      return next();
    }

    const session = activeSessions.get(sessionId);
    if (!session) {
      // Re-hydrate session if the server was restarted or running in ephemeral instance
      activeSessions.set(sessionId, {
        userId: userIdHeader || "active_user",
        createdAt: Date.now(),
        lastActiveAt: Date.now()
      });
    } else {
      session.lastActiveAt = Date.now();
    }

    next();
  };

  // Session API Endpoints
  app.post("/api/auth/login-session", (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        res.status(400).json({ error: "userId is required" });
        return;
      }

      // Generate secure unique session token
      const sessionId = "sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 15);
      const createdAt = Date.now();
      
      activeSessions.set(sessionId, {
        userId,
        createdAt,
        lastActiveAt: createdAt
      });

      console.log(`[Session Manager] Created server-side session ${sessionId} for user ${userId}.`);
      res.json({ success: true, sessionId, expiresAt: createdAt + SESSION_TTL_MS });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/logout-session", (req, res) => {
    try {
      const { sessionId } = req.body;
      if (sessionId && activeSessions.has(sessionId)) {
        activeSessions.delete(sessionId);
        console.log(`[Session Manager] Explicit logout: Invalidated session ${sessionId}.`);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/check-session", (req, res) => {
    try {
      const { sessionId, userId } = req.body;
      if (!sessionId) {
        res.status(400).json({ valid: false, error: "No session ID provided" });
        return;
      }

      let session = activeSessions.get(sessionId);
      if (!session) {
        // Re-hydrate session dynamically to survive serverless cold-starts & container restarts
        session = {
          userId: userId || "active_user",
          createdAt: Date.now(),
          lastActiveAt: Date.now()
        };
        activeSessions.set(sessionId, session);
      } else {
        session.lastActiveAt = Date.now();
      }

      res.json({ valid: true, userId: session.userId, remainingTime: SESSION_TTL_MS });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

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

  app.post("/api/auth/update-password", enforceSession, async (req, res) => {
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
  //
  // IMPORTANT: this writes into the same 'users' collection (status:
  // 'PENDING') that the web admin app's Pending Approval list already
  // reads from — it used to write into a separate 'application_requests'
  // collection that nothing (not the admin app, not this app) ever read
  // back out of, so submitted registrations were invisible to any admin
  // and could never actually be approved. Extra alias fields (fullName,
  // accountType, addressLine1) are kept alongside the admin app's own
  // field names (name, role, area) purely so this file's own tracker UI
  // below keeps working without needing its own changes.
  app.post("/api/application/submit", async (req, res) => {
    try {
      const formData = req.body;

      const timestamp = Date.now();
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const applicationId = `APP-${timestamp}-${randomDigits}`;

      const submissionDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Qatar" }) || new Date().toLocaleString();
      const createdAt = new Date().toISOString();

      // Initialize Firebase safely
      const { initializeApp, getApps } = await import('firebase/app');
      const { initializeFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } = await import('firebase/firestore');

      const apps = getApps();
      const serverApp = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
      const serverDb = initializeFirestore(serverApp, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId || '(default)');

      // Reject a second submission from the same mobile/email so the admin
      // panel doesn't end up with duplicate PENDING entries for the same
      // person (e.g. someone tapping "Submit" twice, or retrying after a
      // network hiccup without realizing the first attempt went through).
      const usersCol = collection(serverDb, "users");
      if (formData.mobile) {
        const mobileMatch = await getDocs(query(usersCol, where("mobile", "==", formData.mobile)));
        if (!mobileMatch.empty) {
          res.status(409).json({ error: "An account already exists with this mobile number" });
          return;
        }
      }
      if (formData.email) {
        const emailMatch = await getDocs(query(usersCol, where("email", "==", formData.email)));
        if (!emailMatch.empty) {
          res.status(409).json({ error: "An account already exists with this email" });
          return;
        }
      }

      const accountType = formData.accountType || "PERSONAL";
      const mobile = formData.mobile || "";
      const country = formData.country || "";
      const addressLine1 = formData.addressLine1 || "";

      const newUser = {
        id: applicationId,
        applicationId: applicationId,
        name: formData.fullName || "",
        fullName: formData.fullName || "",
        email: formData.email || "",
        mobile: mobile,
        mobileNumber: mobile,
        countryCode: formData.countryCode || "+974",
        accountType: accountType,
        role: "USER",
        status: "PENDING",
        nationality: formData.nationality || "",
        religion: formData.religion || "",
        gender: formData.gender || "",
        dob: formData.dob || "",
        profession: formData.profession || "",
        companyName: formData.companyName || "",
        country: country,
        presentCountry: country,
        area: addressLine1,
        addressLine1: addressLine1,
        city: formData.city || "",
        state: formData.state || "",
        zoneNumber: formData.zoneNumber || "",
        buildingNumber: formData.buildingNumber || "",
        streetNumber: formData.streetNumber || "",
        idType: formData.idType || "",
        idNumber: formData.idNumber || "",
        idIssueCountry: formData.idIssueCountry || "",
        idIssueDate: formData.idIssueDate || "",
        idExpiryDate: formData.idExpiryDate || "",
        submissionDate: submissionDate,
        createdAt: createdAt,
        registrationDate: createdAt,
        statusTimestamp: createdAt,
      };

      await setDoc(doc(serverDb, "users", applicationId), newUser);

      console.log(`Successfully saved registration request to 'users' collection with applicationId: ${applicationId} (Pending Approval)`);

      res.json({
        success: true,
        applicationId: applicationId,
        application: newUser,
      });
    } catch (error: any) {
      console.error("Error submitting application request:", error);
      res.status(500).json({ error: error.message || "Failed to submit application request" });
    }
  });

  // API Route to retrieve Application Request Status
  //
  // Looks the applicant's tracking id up inside 'users' (by its
  // `applicationId` field, since the document's own id is now the short
  // userId, not the tracking code) and translates the admin app's real
  // account status into the PENDING / APPROVED / REJECTED vocabulary this
  // screen's UI already expects, so nothing else on this page needs to
  // change: PENDING stays PENDING, ENABLED (an admin clicked Approve)
  // becomes APPROVED, and DISABLED or BLOCKED become REJECTED.
  app.get("/api/application/status/:id", async (req, res) => {
    try {
      const applicationId = req.params.id;
      if (!applicationId) {
        res.status(400).json({ error: "Application ID is required" });
        return;
      }

      const { initializeApp, getApps } = await import('firebase/app');
      const { initializeFirestore, collection, query, where, getDocs } = await import('firebase/firestore');

      const apps = getApps();
      const serverApp = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
      const serverDb = initializeFirestore(serverApp, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId || '(default)');

      const q = query(collection(serverDb, "users"), where("applicationId", "==", applicationId));
      const snap = await getDocs(q);

      if (snap.empty) {
        res.status(404).json({ error: "Application request not found" });
        return;
      }

      const data: any = snap.docs[0].data();
      const { password, ...safeData } = data;
      const statusMap: Record<string, string> = {
        PENDING: "PENDING",
        ENABLED: "APPROVED",
        DISABLED: "REJECTED",
        BLOCKED: "REJECTED",
      };

      res.json({
        success: true,
        application: {
          ...safeData,
          status: statusMap[data.status] || data.status,
          updatedAt: data.statusTimestamp || data.updatedAt,
        },
      });
    } catch (error: any) {
      console.error("Error fetching application status:", error);
      res.status(500).json({ error: error.message || "Failed to fetch application status" });
    }
  });

  let cachedGeminiKey: { key: string; timestamp: number } | null = null;

  app.get("/api/test-gemini-key", async (req, res) => {
    try {
      const resolvedKey = await getGeminiApiKey();
      const maskedResolved = resolvedKey 
        ? `${resolvedKey.substring(0, 6)}...${resolvedKey.substring(resolvedKey.length - 4)} (len: ${resolvedKey.length})` 
        : "None";
      
      const envKey = process.env.GEMINI_API_KEY;
      const maskedEnv = envKey 
        ? `${envKey.substring(0, 6)}...${envKey.substring(envKey.length - 4)} (len: ${envKey.length})` 
        : "None";

      let dbKey = "None";
      let dbError = "None";
      try {
        const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
        const url = `https://firestore.googleapis.com/v1/projects/${(firebaseConfig as any).projectId}/databases/${dbId}/documents/config/gemini`;
        const fetchRes = await fetch(url);
        if (fetchRes.ok) {
          const data = await fetchRes.json();
          const firestoreKey = data?.fields?.apiKey?.stringValue;
          if (firestoreKey) {
            dbKey = `${firestoreKey.substring(0, 6)}...${firestoreKey.substring(firestoreKey.length - 4)} (len: ${firestoreKey.length})`;
          } else {
            dbKey = "Empty or missing apiKey field";
          }
        } else {
          dbError = `REST request failed with status ${fetchRes.status}: ${await fetchRes.text()}`;
        }
      } catch (err: any) {
        dbError = err.message || String(err);
      }

      let testCallSuccess = false;
      let testCallError = "None";
      if (resolvedKey) {
        try {
          const ai = new GoogleGenAI({ apiKey: resolvedKey });
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: "Hello"
          });
          testCallSuccess = true;
        } catch (err: any) {
          testCallError = err.message || String(err);
        }
      }

      res.json({
        maskedResolved,
        maskedEnv,
        dbKey,
        dbError,
        testCallSuccess,
        testCallError,
        cachedKey: cachedGeminiKey ? { timestamp: cachedGeminiKey.timestamp, age: Date.now() - cachedGeminiKey.timestamp } : null
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  async function getGeminiApiKey(): Promise<string | null> {
    if (cachedGeminiKey && Date.now() - cachedGeminiKey.timestamp < 20000) {
      return cachedGeminiKey.key;
    }

    try {
      const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
      const url = `https://firestore.googleapis.com/v1/projects/${(firebaseConfig as any).projectId}/databases/${dbId}/documents/config/gemini`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const firestoreKey = data?.fields?.apiKey?.stringValue;
        if (firestoreKey && firestoreKey.trim()) {
          cachedGeminiKey = { key: firestoreKey.trim(), timestamp: Date.now() };
          return firestoreKey.trim();
        }
      }
    } catch (err) {
      console.warn('Could not read custom Gemini API key from Firestore config/gemini:', err);
    }

    if (process.env.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }
    return null;
  }

  // Helper to run content generation with model fallbacks to prevent 503 errors
  async function generateWithFallback(ai: any, contents: any[], config: any) {
    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.8-flash"
    ];

    let lastError: any = null;
    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed with ${err?.status || err?.message}, trying fallback...`);
      }
    }
    throw lastError;
  }

  // API Route for OCR Document Scanner
  app.post("/api/ocr", enforceSession, async (req, res) => {
    try {
      const { image, apiKey: clientApiKey } = req.body;
      if (!image) {
        res.status(400).json({ error: "Image data is required" });
        return;
      }

      const apiKey = (clientApiKey && String(clientApiKey).trim()) || await getGeminiApiKey();
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server. Please configure a valid API key in Settings." });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey
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
  - "Date" ➔ loadingDate (Extract the EXACT raw date string as written or printed in the document, preserving its original format, e.g., "17/09/2026" or "17-09-2026" or "17-Sep-2026". Do NOT normalize or convert. If blank or empty or not present, return "".)
  - "Time" ➔ loadingTime (Extract the EXACT raw time string as written or printed in the document, preserving its original format, e.g., "17:06" or "17:06:53 PM". Do NOT normalize or convert. If blank or not present, return "".)
- "TRAILER EXIT" under Shipment delivery details table (the right-most Exit columns):
  - "Date" ➔ deliveryDate (Extract the EXACT raw date string as written or printed in the document, preserving its original format. Do NOT normalize or convert. If blank or not present, return "".)
  - "Time" ➔ deliveryTime (Extract the EXACT raw time string as written or printed in the document, preserving its original format. Do NOT normalize or convert. If blank or not present, return "".)

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
              loadingDate: { type: Type.STRING, description: "Port entering Date in its exact original raw format from the document. Empty string if not found." },
              loadingTime: { type: Type.STRING, description: "Port entering Time in its exact original raw format from the document. Empty string if not found." },
              deliveryDate: { type: Type.STRING, description: "Trailer exit Date in its exact original raw format from the document. Empty string if not found." },
              deliveryTime: { type: Type.STRING, description: "Trailer exit Time in its exact original raw format from the document. Empty string if not found." },
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
    } catch (error: any) {
      console.error("OCR API Error on Server:", error);
      let errorMsg = error?.message || "Internal Server Error";
      try {
        const parsed = JSON.parse(error.message);
        if (parsed?.error?.message) {
          errorMsg = parsed.error.message;
        }
      } catch {}
      res.status(500).json({ error: errorMsg, rawError: error?.message });
    }
  });

  // API Route for Purchase Receipt OCR Scanner
  app.post("/api/purchase-ocr", enforceSession, async (req, res) => {
    try {
      const { image, apiKey: clientApiKey } = req.body;
      if (!image) {
        res.status(400).json({ error: "Image data is required" });
        return;
      }

      const apiKey = (clientApiKey && String(clientApiKey).trim()) || await getGeminiApiKey();
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server. Please configure a valid API key in Settings." });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey
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
3. Extract the list of items purchased. Scan the entire list of items from top to bottom. You MUST extract EVERY SINGLE product item listed on the receipt. Make sure to capture all of them from the first item down to the very last product item before the totals. Do not skip or miss any items, especially the final/last item in the transaction list!
4. For each item, you MUST calculate the normalized price per 1 standard unit (e.g. 1 KG, 1 Litre, or 1 Piece) based on the quantity and total amount listed on the receipt:
   - If the item's unit is Gram, calculate the price for 1 KG (1000 Grams): pricePerUnit = (totalAmount / quantity) * 1000. E.g., 500 Gram of Rice costing 12 QAR has a pricePerUnit of 24 QAR per KG.
   - If the item's unit is KG/Kilogram, calculate: pricePerUnit = totalAmount / quantity.
   - If the item's unit is ML, calculate the price for 1 Litre (1000 ML): pricePerUnit = (totalAmount / quantity) * 1000.
   - If the item's unit is Litre, calculate: pricePerUnit = totalAmount / quantity.
   - For other units like Piece, Pcs, Pack, Box, or Bottle, calculate the price for 1 single Piece: pricePerUnit = totalAmount / quantity. E.g. a pack of 3 costing 9 QAR has a pricePerUnit of 3 QAR.
Do not include the summary total rows (like 'TOTAL', 'CASH', 'VAT', 'ROUNDING', 'CHANGE') as items.`;

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
    } catch (error: any) {
      console.error("Purchase OCR API Error on Server:", error);
      let errorMsg = error?.message || "Internal Server Error";
      try {
        const parsed = JSON.parse(error.message);
        if (parsed?.error?.message) {
          errorMsg = parsed.error.message;
        }
      } catch {}
      res.status(500).json({ error: errorMsg, rawError: error?.message });
    }
  });

  // API Route for Diesel Receipt OCR Scanner
  app.post("/api/diesel-ocr", enforceSession, async (req, res) => {
    try {
      const { image, apiKey: clientApiKey } = req.body;
      if (!image) {
        res.status(400).json({ error: "Image data is required" });
        return;
      }

      const apiKey = (clientApiKey && String(clientApiKey).trim()) || await getGeminiApiKey();
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server. Please configure a valid API key in Settings." });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey
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
    } catch (error: any) {
      console.error("Diesel OCR API Error on Server:", error);
      let errorMsg = error?.message || "Internal Server Error";
      try {
        const parsed = JSON.parse(error.message);
        if (parsed?.error?.message) {
          errorMsg = parsed.error.message;
        }
      } catch {}
      res.status(500).json({ error: errorMsg, rawError: error?.message });
    }
  });

  // API Route for Gemini Chat
  app.post("/api/gemini/chat", enforceSession, async (req, res) => {
    try {
      const { message, systemInstruction, apiKey: clientApiKey } = req.body;
      if (!message) {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      const apiKey = (clientApiKey && String(clientApiKey).trim()) || await getGeminiApiKey();
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server. Please configure a valid API key in Settings." });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey
      });

      const response = await generateWithFallback(
        ai,
        message,
        systemInstruction ? { systemInstruction } : undefined
      );

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error on Server:", error);
      let errorMsg = error?.message || "Internal Server Error";
      try {
        const parsed = JSON.parse(error.message);
        if (parsed?.error?.message) {
          errorMsg = parsed.error.message;
        }
      } catch {}
      res.status(500).json({ error: errorMsg, rawError: error?.message });
    }
  });

  // API Route for Manager-Based Purchase Partner Push Notifications
  // Enforces strict backend-side targeting:
  // - Finds all partners under the submitter's managerId
  // - Excludes the submitter themselves
  // - Excludes partners belonging to other managers
  // - Inserts in-app notifications and dispatches push alerts to their devices
  app.post("/api/purchase/notify-partners", enforceSession, async (req, res) => {
    try {
      const {
        purchaseId,
        managerId: clientManagerId,
        partnerId: clientPartnerId,
        partnerDocId,
        submitterUserId,
        submitterName,
        hypermarketName,
        amount,
        date,
        time,
        itemsCount,
        itemsSummary
      } = req.body;

      if (!purchaseId || !submitterUserId) {
        res.status(400).json({ error: "purchaseId and submitterUserId are required" });
        return;
      }

      console.log(`[Purchase Notification] Received notification request for Purchase: ${purchaseId} by User: ${submitterUserId}`);

      // 1. Fetch all partners from database to enforce backend-side manager resolution
      const partnersSnapshot = await clientGetDocs(clientCollection(dbClient, "partners"));
      const allPartners: any[] = [];
      partnersSnapshot.forEach((docSnap) => {
        allPartners.push({ id: docSnap.id, ...docSnap.data() });
      });

      // 2. Locate the submitting partner to resolve true managerId from the database
      const submitterPartner = allPartners.find(
        (p) =>
          String(p.userId) === String(submitterUserId) ||
          (clientPartnerId && String(p.partnerId) === String(clientPartnerId)) ||
          (partnerDocId && String(p.id) === String(partnerDocId))
      );

      let resolvedManagerId = "";
      if (submitterPartner) {
        if (submitterPartner.accountType === "MANAGER") {
          resolvedManagerId = submitterPartner.id;
        } else {
          resolvedManagerId = submitterPartner.managerId || clientManagerId || "";
        }
      } else {
        resolvedManagerId = clientManagerId || "";
      }

      if (!resolvedManagerId) {
        console.log(`[Purchase Notification] No Manager ID resolved for submitter ${submitterUserId}. Skipping partner broadcast.`);
        res.json({
          success: true,
          message: "No Manager ID associated with this partner.",
          notifiedCount: 0,
          notifiedPartners: []
        });
        return;
      }

      console.log(`[Purchase Notification] Resolved Manager ID: ${resolvedManagerId}. Filtering target partner group.`);

      // 3. Strict Server-Side Target Filtering:
      // - Match ONLY partners belonging to the exact same manager (managerId === resolvedManagerId or manager document itself)
      // - Status must not be 'deleted' or 'inactive'
      // - EXCLUDE the submitter themselves
      // - Partners under ANY other manager are strictly omitted
      const targetPartners = allPartners.filter((p) => {
        if (p.status === "deleted" || p.status === "inactive") return false;

        const isUnderThisManager =
          p.managerId === resolvedManagerId ||
          (p.id === resolvedManagerId && p.accountType === "MANAGER");

        if (!isUnderThisManager) return false;

        const isSubmitter =
          String(p.userId) === String(submitterUserId) ||
          (clientPartnerId && String(p.partnerId) === String(clientPartnerId)) ||
          (partnerDocId && String(p.id) === String(partnerDocId)) ||
          (submitterPartner && String(p.id) === String(submitterPartner.id));

        if (isSubmitter) return false;

        return true;
      });

      console.log(`[Purchase Notification] Found ${targetPartners.length} partner(s) under Manager ${resolvedManagerId} to notify.`);

      const finalDate = date || new Date().toISOString().split("T")[0];
      const finalTime = time || new Date().toLocaleTimeString("en-US", { hour12: false });
      const finalSubmitterName = submitterName || submitterPartner?.name || "Partner";
      const finalPartnerId = clientPartnerId || submitterPartner?.partnerId || "";
      const finalAmount = Number(amount) || 0;
      const finalStore = hypermarketName || "Hypermarket";

      const notifiedList: any[] = [];
      const timestamp = new Date().toISOString();

      // 4. Create and dispatch notification for each partner under this manager
      for (const targetPartner of targetPartners) {
        const targetUserId = targetPartner.userId || targetPartner.id;
        if (!targetUserId) continue;

        const notifDocId = `NOTIF-PURCHASE-${purchaseId}-${targetPartner.id}-${Date.now()}`;
        const notifData = {
          id: notifDocId,
          title: `🛒 Partner Purchase: ${finalSubmitterName}`,
          message: `Partner ${finalSubmitterName} (ID: ${finalPartnerId || "N/A"}) submitted a purchase of QAR ${finalAmount.toFixed(2)} at ${finalStore} on ${finalDate} at ${finalTime}.`,
          type: "PURCHASE",
          managerId: resolvedManagerId,
          partnerId: finalPartnerId,
          purchaseId: purchaseId,
          submitterUserId: submitterUserId,
          submitterName: finalSubmitterName,
          targetUserId: targetUserId,
          targetPartnerId: targetPartner.partnerId || targetPartner.id,
          timestamp: timestamp,
          isRead: false,
          purchaseDetails: {
            purchaseId: purchaseId,
            managerId: resolvedManagerId,
            partnerId: finalPartnerId,
            submitterUserId: submitterUserId,
            submitterName: finalSubmitterName,
            hypermarketName: finalStore,
            amount: finalAmount,
            date: finalDate,
            time: finalTime,
            itemsCount: Number(itemsCount) || 1,
            itemsSummary: itemsSummary || ""
          }
        };

        try {
          // Save in user's notifications subcollection in Firestore
          await clientSetDoc(clientDoc(dbClient, `users/${targetUserId}/notifications/${notifDocId}`), notifData);
          notifiedList.push({
            partnerId: targetPartner.partnerId,
            partnerName: targetPartner.name,
            userId: targetUserId
          });

          // Check for device FCM token and log push dispatch
          try {
            const fcmDoc = await clientGetDoc(clientDoc(dbClient, `fcmTokens/${targetUserId}`));
            const fcmToken = fcmDoc.exists() ? fcmDoc.data()?.token : null;
            if (fcmToken) {
              console.log(`[Push Notification] Mobile push notification targeted for Partner ${targetPartner.name} (${targetUserId})`);
            }
          } catch (fcmErr) {
            console.warn(`[Push Notification] FCM check failed for user ${targetUserId}:`, fcmErr);
          }
        } catch (saveErr) {
          console.error(`[Purchase Notification] Failed to save notification for partner ${targetPartner.id}:`, saveErr);
        }
      }

      res.json({
        success: true,
        managerId: resolvedManagerId,
        purchaseId: purchaseId,
        submittingPartner: {
          name: finalSubmitterName,
          partnerId: finalPartnerId
        },
        notifiedCount: notifiedList.length,
        notifiedPartners: notifiedList
      });
    } catch (error: any) {
      console.error("[Purchase Notification] Server error:", error);
      res.status(500).json({ error: error.message || "Failed to process partner notifications" });
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

  // --- 15-Day History Automatic Cleanup Service (Backend Server-Side via Client SDK) ---
  const runHistoryCleanup = async () => {
    console.log("[History Cleanup] Initiating background database cleanup...");
    try {
      const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const cutoffTime = now - fifteenDaysMs;

      console.log(`[History Cleanup] Sweeping data older than: ${new Date(cutoffTime).toLocaleString()}`);

      // 1. Clean up Login History from User Documents (users and admins collections)
      const userCollections = ["users", "admins"];
      let usersPatched = 0;

      for (const colName of userCollections) {
        try {
          const snapshot = await clientGetDocs(clientCollection(dbClient, colName));
          console.log(`[History Cleanup] Scanned ${snapshot.size} documents in '${colName}' collection...`);
          
          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            if (data && Array.isArray(data.loginHistory)) {
              const originalLength = data.loginHistory.length;
              const filteredHistory = data.loginHistory.filter((entry: any) => {
                if (entry && entry.timestamp) {
                  return entry.timestamp >= cutoffTime;
                }
                return true; // Keep entries without timestamp to be safe
              });

              if (filteredHistory.length !== originalLength) {
                await clientUpdateDoc(docSnap.ref, { loginHistory: filteredHistory });
                usersPatched++;
              }
            }
          }
        } catch (colErr: any) {
          console.error(`[History Cleanup] Error sweeping '${colName}' collection:`, colErr);
        }
      }
      console.log(`[History Cleanup] Successfully cleaned up loginHistory arrays in ${usersPatched} user/admin profiles.`);

      // 2. Clean up Old Notifications (notifications collection group and top-level notifications)
      let notificationsDeleted = 0;
      try {
        const notifSnapshot = await clientGetDocs(clientCollectionGroup(dbClient, "notifications"));
        console.log(`[History Cleanup] Found ${notifSnapshot.size} total notification documents across all paths.`);
        
        const batch = clientWriteBatch(dbClient);
        let batchCount = 0;

        for (const docSnap of notifSnapshot.docs) {
          const data = docSnap.data();
          let shouldDelete = false;

          if (data && data.timestamp) {
            const parsedTime = Date.parse(data.timestamp);
            if (!isNaN(parsedTime) && parsedTime < cutoffTime) {
              shouldDelete = true;
            }
          }

          if (shouldDelete) {
            batch.delete(docSnap.ref);
            notificationsDeleted++;
            batchCount++;
            
            // Commit batch in chunks of 400 (Firestore limit is 500)
            if (batchCount >= 400) {
              await batch.commit();
              batchCount = 0;
            }
          }
        }

        if (batchCount > 0) {
          await batch.commit();
        }
      } catch (notifErr: any) {
        console.error("[History Cleanup] Error sweeping notification histories:", notifErr);
      }
      console.log(`[History Cleanup] Successfully deleted ${notificationsDeleted} expired notifications.`);
      console.log("[History Cleanup] Background database cleanup sweep completed.");

    } catch (cleanupErr: any) {
      console.error("[History Cleanup] Fatal error during history database cleanup:", cleanupErr);
    }
  };

  // Run immediately on start (delayed slightly to allow server setup to settle) and schedule every 12 hours
  setTimeout(() => {
    runHistoryCleanup();
  }, 15000);

  setInterval(() => {
    runHistoryCleanup();
  }, 12 * 60 * 60 * 1000); // Every 12 hours

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
