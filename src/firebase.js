import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDu449XqKWY2Fh49JVgW6Q8GDkSW9ThSX4",
  authDomain: "quiz-4129b.firebaseapp.com",
  projectId: "quiz-4129b",
  storageBucket: "quiz-4129b.firebasestorage.app",
  messagingSenderId: "57331319537",
  appId: "1:57331319537:web:dae43818de35f01d6a5f50"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
