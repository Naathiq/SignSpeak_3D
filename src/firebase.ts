import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBbq1Zxo8R11LdzBnsG9sPDZG0Ia4txqAc",
  authDomain: "smart-classroom-90e22.firebaseapp.com",
  databaseURL: "https://smart-classroom-90e22-default-rtdb.firebaseio.com",
  projectId: "smart-classroom-90e22",
  storageBucket: "smart-classroom-90e22.firebasestorage.app",
  messagingSenderId: "875684833270",
  appId: "1:875684833270:web:3ad5e94e8d3b94337709d7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
