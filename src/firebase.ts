// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSlrXHDf1E-qWxCKISrVKeOS2llajeglw",
  authDomain: "my-first-multiplayer-6dd35.firebaseapp.com",
  databaseURL: "https://my-first-multiplayer-6dd35-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "my-first-multiplayer-6dd35",
  storageBucket: "my-first-multiplayer-6dd35.appspot.com",
  messagingSenderId: "933237749624",
  appId: "1:933237749624:web:56d782403ba3d8a56bba8d"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
