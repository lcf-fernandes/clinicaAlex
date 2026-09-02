import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Configuração do projeto "clinicaalex-47cf9" no Firebase Console.
// Essas chaves identificam o projeto publicamente e não são segredo —
// a segurança real vem das regras do Firestore (firestore.rules) e do
// Firebase Auth, não de esconder este objeto.
const firebaseConfig = {
  apiKey: "AIzaSyBi2hqgw6IqvkNgsvkmjqILx5V0nI-Wogg",
  authDomain: "clinicaalex-47cf9.firebaseapp.com",
  projectId: "clinicaalex-47cf9",
  storageBucket: "clinicaalex-47cf9.firebasestorage.app",
  messagingSenderId: "523408768808",
  appId: "1:523408768808:web:a83a23b7553d2f2cfe5a1d",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
