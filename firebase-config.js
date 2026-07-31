/* ==========================================================================
   Configuração do Firebase — projeto "edusense-7b027".
   ATENÇÃO: este arquivo deve conter APENAS o objeto abaixo, com o nome
   exato FIREBASE_CONFIG. Não cole aqui as tags <script> nem os "imports"
   que o console do Firebase mostra — o app.js já faz essa parte.

   Este apiKey é um identificador público do projeto Firebase (diferente de
   uma chave da API Gemini) e pode ficar no repositório. A proteção é feita
   pelos domínios autorizados em Authentication > Settings.
   ========================================================================== */

<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyA8lCSb3QWRoYAZQHavcJo3YzP7dTA9vN8",
    authDomain: "edusense-7b027.firebaseapp.com",
    projectId: "edusense-7b027",
    storageBucket: "edusense-7b027.firebasestorage.app",
    messagingSenderId: "799185145852",
    appId: "1:799185145852:web:0df7faf3889e559916ec79",
    measurementId: "G-ZPFDGLRE1S"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
