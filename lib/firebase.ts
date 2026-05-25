import { initializeApp, getApps } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA9gGWAse4hO2Kq3mbkUY-pN7EoiJLSatw",
  authDomain: "pitzbol.firebaseapp.com",
  projectId: "pitzbol",
  storageBucket: "pitzbol.firebasestorage.app",
  messagingSenderId: "399982512044",
  appId: "1:399982512044:web:a9c55fe5b88aa5e2399c09",
  measurementId: "G-3EQ0BG6ZBN",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const storage = getStorage(app);
