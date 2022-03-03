//import {} from './types/env'

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  appId: import.meta.env.VITE_FIREBASE_appId,
  apiKey: import.meta.env.VITE_FIREBASE_apiKey,
  projectId: import.meta.env.VITE_FIREBASE_projectId,
  authDomain: import.meta.env.VITE_FIREBASE_authDomain,
  databaseURL: import.meta.env.VITE_FIREBASE_databaseURL,
  storageBucket: import.meta.env.VITE_FIREBASE_storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_messagingSenderId,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
