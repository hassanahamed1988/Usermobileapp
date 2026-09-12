import { applyMaskingBeforeSave, decryptSensitiveFields } from "../utils/security";
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, collection, collectionGroup, doc, setDoc, deleteDoc, getDocs, writeBatch, onSnapshot, query, QueryConstraint, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, { 
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
console.log('Firebase DB initialized with database ID:', (db as any)._databaseId);

import { getDocFromServer } from 'firebase/firestore';



export const auth = getAuth();

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Fetch all documents from a Firestore collection
export async function getFirebaseCollection(collectionName: string): Promise<any[]> {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const items: any[] = [];
    querySnapshot.forEach((doc) => {
      items.push(decryptSensitiveFields({ ...doc.data(), id: doc.id }));
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
  }
}

// Save or Update a single document in a Firestore collection
export async function saveFirebaseDoc(collectionName: string, docId: string, data: any): Promise<void> {
  try {
    // Avoid storing undefined properties in Firestore
    let cleanedData = JSON.parse(JSON.stringify(data));
    cleanedData = applyMaskingBeforeSave(cleanedData);
    
    // Inject Firebase UID for ownership tracking if logged in
    if (auth.currentUser) {
      cleanedData.firebaseUid = auth.currentUser.uid;
    }

    console.log(`Attempting to save to Firestore: ${collectionName}/${docId}`, cleanedData);
    await setDoc(doc(db, collectionName, docId), cleanedData, { merge: true });
    console.log(`Successfully saved to Firestore: ${collectionName}/${docId}`);
  } catch (error) {
    console.error(`Firestore save error: ${collectionName}/${docId}`, error);
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${docId}`);
  }
}

// Delete a single document from a Firestore collection
export async function deleteFirebaseDoc(collectionName: string, docId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${docId}`);
  }
}

export function subscribeFirebaseCollection(collectionName: string, callback: (data: any[]) => void, constraints?: QueryConstraint[]): () => void {
  try {
    const colRef = collection(db, collectionName);
    const q = constraints && constraints.length > 0 ? query(colRef, ...constraints) : colRef;
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        items.push(decryptSensitiveFields({ ...doc.data(), id: doc.id }));
      });
      callback(items);
    }, (error) => {
      console.warn(`Error subscribing to collection ${collectionName}`, error);
    });
    return unsubscribe;
  } catch (error) {
    console.warn(`Could not subscribe to collection ${collectionName}, returning empty array via callback.`, error);
    callback([]);
    return () => {};
  }
}

export function subscribeFirebaseCollectionGroup(collectionName: string, callback: (data: any[]) => void, constraints?: QueryConstraint[]): () => void {
  try {
    const colRef = collectionGroup(db, collectionName);
    const q = constraints && constraints.length > 0 ? query(colRef, ...constraints) : colRef;
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        items.push(decryptSensitiveFields({ ...doc.data(), id: doc.id }));
      });
      callback(items);
    }, (error) => {
      console.warn(`Error subscribing to collectionGroup ${collectionName}`, error);
    });
    return unsubscribe;
  } catch (error) {
    console.warn(`Could not subscribe to collectionGroup ${collectionName}, returning empty array via callback.`, error);
    callback([]);
    return () => {};
  }
}

// Sync local configuration data to Firestore
export async function syncFirebaseCollection(collectionName: string, items: any[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    // Limit to 500 documents per batch execution in Firestore
    const sliced = items.slice(0, 500);
    sliced.forEach((item) => {
      if (item && item.id) {
        let cleanedItem = JSON.parse(JSON.stringify(item));
        cleanedItem = applyMaskingBeforeSave(cleanedItem);
        const ref = doc(db, collectionName, item.id);
        batch.set(ref, cleanedItem, { merge: true });
      }
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionName);
  }
}

export function subscribeFirebaseDoc(collectionName: string, docId: string, callback: (data: any) => void) {
  try {
    const d = doc(db, collectionName, docId);
    const unsubscribe = onSnapshot(d, (docSnap) => {
      if (docSnap.exists()) {
        callback(decryptSensitiveFields(docSnap.data()));
      } else {
        callback(null);
      }
    }, (error) => {
      console.warn(`Could not subscribe to ${collectionName}/${docId}`, error);
      callback(null);
    });
    return unsubscribe;
  } catch (error) {
    console.warn(`Error setting up snapshot for ${collectionName}/${docId}`, error);
    callback(null);
    return () => {};
  }
}

export async function saveFirebaseDocMerge(collectionName: string, docId: string, data: any): Promise<void> {
  try {
    const d = doc(db, collectionName, docId);
    let cleanedData = JSON.parse(JSON.stringify(data));
    cleanedData = applyMaskingBeforeSave(cleanedData);
    await setDoc(d, cleanedData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionName);
  }
}
export async function clearFirebaseCollection(collectionName: string, items: any[]): Promise<void> {
  try {
    for (let i = 0; i < items.length; i += 500) {
      const batch = writeBatch(db);
      const chunk = items.slice(i, i + 500);
      chunk.forEach((item) => {
        if (item && item.id) {
          batch.delete(doc(db, collectionName, item.id));
        }
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, collectionName);
  }
}


