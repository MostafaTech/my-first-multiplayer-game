/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_apiKey: string;
  readonly VITE_FIREBASE_authDomain: string;
  readonly VITE_FIREBASE_databaseURL: string;
  readonly VITE_FIREBASE_projectId: string;
  readonly VITE_FIREBASE_storageBucket: string;
  readonly VITE_FIREBASE_messagingSenderId: string;
  readonly VITE_FIREBASE_appId: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
