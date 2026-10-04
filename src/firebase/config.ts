import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Configuração do projeto "clinicaalex-47cf9" no Firebase Console,
// fixa no código para não depender de Environment Variables na Vercel
// (histórico: chegou a causar tela em branco por falta delas lá).
// Essas chaves identificam o projeto publicamente e não são segredo —
// a segurança real vem das regras do Firestore (firestore.rules), do
// Firebase Auth e da restrição do apiKey no Google Cloud Console (ver
// README), não de esconder este objeto.
export const firebaseConfig = {
  apiKey: "AIzaSyBi2hqgw6IqvkNgsvkmjqILx5V0nI-Wogg",
  authDomain: "clinicaalex-47cf9.firebaseapp.com",
  projectId: "clinicaalex-47cf9",
  storageBucket: "clinicaalex-47cf9.firebasestorage.app",
  messagingSenderId: "523408768808",
  appId: "1:523408768808:web:a83a23b7553d2f2cfe5a1d",
};

export const app = initializeApp(firebaseConfig);
// ignoreUndefinedProperties: os formulários costumam montar objetos
// com "campo: valor || undefined" pra campos opcionais vazios — sem
// isso, o Firestore rejeita addDoc()/setDoc() com "Unsupported field
// value: undefined" em qualquer um desses campos.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
export const auth = getAuth(app);
