
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-analytics.js";


import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyABd-M3KMhyZ-pX5Q1MVgqrVwCjGWknWwM",
  authDomain: "edusense-7b027.firebaseapp.com",
  projectId: "edusense-7b027",
  storageBucket: "edusense-7b027.firebasestorage.app",
  messagingSenderId: "799185145852",
  appId: "1:799185145852:web:0c1c98acbacb29d916ec79",
  measurementId: "G-RLGWGC2WML"
};


export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);


export const auth = getAuth(app);
