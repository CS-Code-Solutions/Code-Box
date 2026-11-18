// js/firebase-config.js
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Inicializa Firebase (SDK Compat)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// E-mail autorizado (camada extra no front-end além do firestore.rules)
const OWNER_EMAIL = "SEU_EMAIL_AQUI@gmail.com";

// Coleções do CodeBox
const COLLECTIONS = {
  PROJETOS: "codebox_projetos",
  SERVICOS: "codebox_servicos",
  SEGREDOS: "codebox_segredos",
  CONFIG: "codebox_config"
};
