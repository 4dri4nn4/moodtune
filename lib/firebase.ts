import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC8-Of0wncUCHNlZ3J1xuxLaM2FUJpoG48",
  authDomain: "moodtune-8995a.firebaseapp.com",
  projectId: "moodtune-8995a",
  storageBucket: "moodtune-8995a.firebasestorage.app",
  messagingSenderId: "788309827226",
  appId: "1:788309827226:web:a16e103dc7115c4d3ac923",
};

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;