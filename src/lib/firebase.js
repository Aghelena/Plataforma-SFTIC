// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC5OyiMBdTt-IPBZKB6fsPRAH5ierkhJGo",
  authDomain: "plataforma-sfitc.firebaseapp.com",
  projectId: "plataforma-sfitc",
  // storageBucket: "plataforma-sfitc.appspot.com", // se usar Storage
  messagingSenderId: "659392517653",
  appId: "1:659392517653:web:7a3ca7339b00c838f9201c",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
});
