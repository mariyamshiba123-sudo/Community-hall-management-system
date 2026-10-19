import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAT_YEd6V1AIDVW-tDkoJU2erJiZTHWXJo",
  authDomain: "communityhallmanagement.firebaseapp.com",
  projectId: "communityhallmanagement",
  storageBucket: "communityhallmanagement.firebasestorage.app",
  messagingSenderId:"571726922784",
  appId: "1:571726922784:web:ba70f0251a3cc0f87e2845"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
