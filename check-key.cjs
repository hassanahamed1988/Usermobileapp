const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

admin.initializeApp();
const db = getFirestore("fleetpromanager");

async function check() {
  const doc = await db.collection("config").doc("gemini").get();
  if (doc.exists) {
    console.log("Firestore Key:", doc.data().apiKey ? "EXISTS" : "MISSING", "Value:", doc.data().apiKey);
  } else {
    console.log("Firestore doc config/gemini DOES NOT EXIST");
  }
}
check().catch(console.error);
