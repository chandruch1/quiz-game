import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase only if the placeholder is changed, to avoid throwing errors instantly 
// that block the UI, though eventually this should be filled by the user.
let app;
try {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
    app = initializeApp(firebaseConfig);
  } else {
    console.warn("Using offline mock mode. Add your Firebase keys to connect to the cloud.");
    app = null;
  }
} catch (e) {
  console.error("Firebase initialization failed. Did you configure the keys?", e);
}

export const db = app ? getFirestore(app) : null;
export const rtdb = app ? getDatabase(app) : null;
