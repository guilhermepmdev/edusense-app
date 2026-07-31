<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyABd-M3KMhyZ-pX5Q1MVgqrVwCjGWknWwM",
    authDomain: "edusense-7b027.firebaseapp.com",
    projectId: "edusense-7b027",
    storageBucket: "edusense-7b027.firebasestorage.app",
    messagingSenderId: "799185145852",
    appId: "1:799185145852:web:0c1c98acbacb29d916ec79",
    measurementId: "G-RLGWGC2WML"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
