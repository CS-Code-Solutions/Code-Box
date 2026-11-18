// js/firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyD3p1abmkOT7NXbwMhnmlLTtk52IR5JdLM",
  authDomain: "codebox-ee31e.firebaseapp.com",
  projectId: "codebox-ee31e",
  storageBucket: "codebox-ee31e.firebasestorage.app",
  messagingSenderId: "710591563279",
  appId: "1:710591563279:web:144267c8bb4db646ca057a"
};

// Inicializa Firebase (SDK Compat para GitHub Pages / HTML estático)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// E-mail autorizado (substitua pelo seu e-mail exato de login)
const OWNER_EMAIL = "SEU_EMAIL_AQUI@gmail.com";

// Coleções do CodeBox
const COLLECTIONS = {
  PROJETOS: "codebox_projetos",
  SERVICOS: "codebox_servicos",
  SEGREDOS: "codebox_segredos",
  CONFIG: "codebox_config"
};
