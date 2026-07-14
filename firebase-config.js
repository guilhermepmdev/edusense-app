/* ==========================================================================
   Configuração do Firebase — necessária apenas para o "Entrar com Google".
   Os modos "minha chave" e "demonstração" funcionam sem preencher nada aqui.

   Como obter (uma única vez, gratuito):
   1. Acesse https://console.firebase.google.com e crie um projeto.
   2. Em "Firebase AI Logic", clique em "Get started" e escolha o provedor
      "Gemini Developer API" (free tier, plano Spark, sem cartão).
   3. Em "Authentication > Sign-in method", ative o provedor "Google".
   4. Em "Authentication > Settings > Authorized domains", adicione o domínio
      do seu GitHub Pages (ex.: seuusuario.github.io).
   5. Em "Configurações do projeto > Seus apps", registre um app Web (</>) e
      copie o objeto firebaseConfig para cá.

   Observação: este apiKey do Firebase é um identificador público do projeto,
   diferente de uma chave da API Gemini — pode ser publicado no repositório.
   ========================================================================== */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyABd-M3KMhyZ-pX5Q1MVgqrVwCjGWknWwM",
    authDomain: "edusense-7b027.firebaseapp.com",
    projectId: "edusense-7b027",
    storageBucket: "edusense-7b027.firebasestorage.app",
    messagingSenderId: "799185145852",
    appId: "1:799185145852:web:0c1c98acbacb29d916ec79",
    measurementId: "G-RLGWGC2WML"
  };
