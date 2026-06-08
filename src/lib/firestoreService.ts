import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  writeBatch 
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Employee } from "../types";
import { generateRichEmployees } from "../data/employees";

// ===================================
// Firestore Error Diagnostic Handlers
// ===================================

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to safely serialize path/ID segments containing forward slashes
export function encodeDocumentId(id: string): string {
  return id.replace(/\//g, "_slash_");
}

export function decodeDocumentId(id: string): string {
  return id.replace(/_slash_/g, "/");
}

// ===================================
// 1. Employee Directory Sync
// ===================================

/**
 * Fetch all employee records from Firestore.
 * If empty and not explicitly locked, seeds the list with default employees.
 */
export async function fetchEmployeesFromFirestore(): Promise<Employee[]> {
  const path = "employees";
  try {
    const colRef = collection(db, path);
    const snapshot = await getDocs(colRef);
    
    if (snapshot.empty) {
      return [];
    }

    const list: Employee[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as Employee);
    });
    return list;
  } catch (err) {
    console.error("Gagal mengambil data pegawai dari Firestore:", err);
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

/**
 * Atomically synchronize local employee list to Cloud Firestore database in batches of 450.
 */
export async function syncEmployeesToFirestore(newList: Employee[]): Promise<void> {
  const path = "employees";
  try {
    const colRef = collection(db, path);
    const snapshot = await getDocs(colRef);
    const existingNips = snapshot.docs.map((doc) => decodeDocumentId(doc.id));
    
    const newNips = new Set(newList.map((emp) => emp.nip));

    // Identify removals
    const deletes = existingNips.filter((nip) => !newNips.has(nip));
    const writes = newList;

    const chunkSize = 450;

    // Track state of wiping in localStorage to stop auto-seeding
    if (newList.length === 0) {
      localStorage.setItem("simpati_db_wiped", "true");
    } else {
      localStorage.removeItem("simpati_db_wiped");
    }

    // Process deletes
    for (let i = 0; i < deletes.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = deletes.slice(i, i + chunkSize);
      for (const nip of chunk) {
        batch.delete(doc(db, path, encodeDocumentId(nip)));
      }
      await batch.commit();
    }

    // Process sets
    for (let i = 0; i < writes.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = writes.slice(i, i + chunkSize);
      for (const emp of chunk) {
        batch.set(doc(db, path, encodeDocumentId(emp.nip)), emp);
      }
      await batch.commit();
    }
    console.log("Koleksi data pegawai berhasil sinkron ke cloud.");
  } catch (err) {
    console.error("Gagal sinkron data pegawai ke Firestore:", err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ===================================
// 2. Allowed Whitelist Emails Sync
// ===================================

/**
 * Fetch whistleblower/attendance whitelist login emails from Firestore.
 */
export async function fetchAllowedEmailsFromFirestore(): Promise<string[]> {
  const path = "allowed_emails";
  try {
    const colRef = collection(db, path);
    const snapshot = await getDocs(colRef);
    
    if (snapshot.empty) {
      const defaultList = ["samkidproject@gmail.com", "lukepoktlampung@gmail.com"];
      return defaultList;
    }

    const list: string[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      if (data && data.email) {
        list.push(data.email.trim().toLowerCase());
      }
    });

    // Ensure super admins are always present
    const superAdmins = ["samkidproject@gmail.com", "lukepoktlampung@gmail.com"];
    return Array.from(new Set([...superAdmins, ...list]));
  } catch (err) {
    console.error("Gagal mengambil daftar email dari Firestore:", err);
    handleFirestoreError(err, OperationType.GET, path);
    return ["samkidproject@gmail.com", "lukepoktlampung@gmail.com"];
  }
}

/**
 * Sync whitelist emails list to Cloud Firestore.
 */
export async function syncAllowedEmailsToFirestore(emails: string[]): Promise<void> {
  const path = "allowed_emails";
  try {
    const colRef = collection(db, path);
    const snapshot = await getDocs(colRef);
    const existingEmails = snapshot.docs.map((doc) => decodeDocumentId(doc.id));

    const cleanEmails = Array.from(
      new Set(emails.map((e) => e.trim().toLowerCase()))
    );
    const newEmailsSet = new Set(cleanEmails);

    const deletes = existingEmails.filter((email) => !newEmailsSet.has(email));
    const writes = cleanEmails;

    const batch = writeBatch(db);
    for (const email of deletes) {
      batch.delete(doc(db, path, encodeDocumentId(email)));
    }
    for (const email of writes) {
      batch.set(doc(db, path, encodeDocumentId(email)), { email });
    }
    await batch.commit();
    console.log("Whitelist email berhasil tersinkron ke cloud.");
  } catch (err) {
    console.error("Gagal sinkron daftar whitelist email ke Firestore:", err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ===================================
// 3. Face Biometrics Registry Operations
// ===================================

/**
 * Save user biometric reference photo to Cloud Firestore.
 */
export async function saveFaceReferenceToFirestore(
  email: string,
  imageBase64: string
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const encodedEmail = encodeDocumentId(cleanEmail);
  const path = `face_references/${encodedEmail}`;
  try {
    const docRef = doc(db, "face_references", encodedEmail);
    await setDoc(docRef, { email: cleanEmail, referenceImage: imageBase64 });
    console.log(`Foto referensi Face ID untuk ${cleanEmail} disimpan di cloud.`);
  } catch (err) {
    console.error("Gagal menyimpan Face ID:", err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete user biometric reference photo from Cloud Firestore.
 */
export async function deleteFaceReferenceFromFirestore(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const encodedEmail = encodeDocumentId(cleanEmail);
  const path = `face_references/${encodedEmail}`;
  try {
    const docRef = doc(db, "face_references", encodedEmail);
    await deleteDoc(docRef);
    console.log(`Foto referensi Face ID untuk ${cleanEmail} dihapus dari cloud.`);
  } catch (err) {
    console.error("Gagal menghapus Face ID:", err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Fetch registered user biometric reference image from Cloud Firestore.
 */
export async function fetchFaceReferenceFromFirestore(email: string): Promise<string | null> {
  const cleanEmail = email.trim().toLowerCase();
  const encodedEmail = encodeDocumentId(cleanEmail);
  const path = `face_references/${encodedEmail}`;
  try {
    const docRef = doc(db, "face_references", encodedEmail);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return data.referenceImage || null;
    }
    return null;
  } catch (err) {
    console.error("Gagal membaca Face ID dari cloud:", err);
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

/**
 * Fetch a list of all emails that have enrolled Face ID registered.
 */
export async function fetchRegisteredFaceEmailsFromFirestore(): Promise<string[]> {
  const path = "face_references";
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    const list: string[] = [];
    snap.forEach((doc) => {
      list.push(decodeDocumentId(doc.id));
    });
    return list;
  } catch (err) {
    console.error("Gagal mendaftar email Face ID dari cloud:", err);
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}
