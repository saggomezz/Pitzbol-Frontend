import { getApps, initializeApp, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export interface ItinerarioGuardado {
  id: string;
  titulo: string;
  fecha: string;
  meta: { budget: number; groupSize: number; duration: string };
  stops: { nombre: string; categoria: string; direccion: string; horaLlegada: string; horaSalida: string; costo: string }[];
}

export async function getItinerariosUsuario(uid: string): Promise<ItinerarioGuardado[]> {
  const db = getFirestore(app);
  const ref = collection(db, 'usuarios', uid, 'itinerarios');
  const q = query(ref, orderBy('creadoEn', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ItinerarioGuardado));
}
