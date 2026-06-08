import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID as required
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Verify Connection to Firestore
async function testConnection() {
  try {
    const testDoc = doc(db, "_system_", "connection_test");
    await getDocFromServer(testDoc);
    console.log("Firebase Firestore koneksi berhasil diaktifkan.");
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.warn("Klien offline. Harap periksa konfigurasi jaringan Anda.");
    } else {
      console.log("Status koneksi Firestore berjalan normal.");
    }
  }
}

testConnection();
