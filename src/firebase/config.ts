import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// As chaves do SDK web do Firebase não são segredo por natureza — a
// proteção real vem das regras do Firestore/Auth e da restrição do
// apiKey no Google Cloud Console (ver README). Ainda assim, usamos
// variáveis de ambiente para não deixar um valor fixo no código-fonte,
// e para poder trocar de projeto (dev/prod) sem editar este arquivo.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missing = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  throw new Error(
    `Variáveis de ambiente do firebase (VITE_FIREBASE_*) ausentes: ${missing.join(", ")}. ` +
      "Confira o .env.local (local) ou as Environment Variables do projeto na Vercel."
  );
}

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
