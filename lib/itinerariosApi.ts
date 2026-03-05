import { getApps, initializeApp, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function getRoleCollection(role: string): string {
  const map: Record<string, string> = { turista: 'turistas', guia: 'guias', admin: 'admins' };
  return map[role] || 'turistas';
}

export interface ItinerarioGuardado {
  id: string;
  titulo: string;
  fecha: string;
  meta: { budget: number; groupSize: number; duration: string };
  stops: { nombre: string; categoria: string; direccion: string; horaLlegada: string; horaSalida: string; costo: string }[];
}

export async function getItinerariosUsuario(uid: string, role: string = 'turista'): Promise<ItinerarioGuardado[]> {
  const db = getFirestore(app);
  const roleCollection = getRoleCollection(role);

  // Buscar el documento del usuario en usuarios/{roleCollection}/lista donde uid == uid
  const listaRef = collection(db, 'usuarios', roleCollection, 'lista');
  const userSnap = await getDocs(query(listaRef, where('uid', '==', uid)));

  if (userSnap.empty) return [];

  // Leer la subcolección itinerarios dentro del documento del usuario
  const userDocRef = userSnap.docs[0].ref;
  const snap = await getDocs(query(collection(userDocRef, 'itinerarios'), orderBy('creadoEn', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ItinerarioGuardado));
}
