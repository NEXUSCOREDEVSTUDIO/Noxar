// Firebase inicial
const firebaseConfig = {
  apiKey: "AIzaSyC5w3HigxtuQk_4-wwb9A8hMuIy04NXpK0",
  authDomain: "noxar-2f1b9.firebaseapp.com",
  projectId: "noxar-2f1b9",
  storageBucket: "noxar-2f1b9.firebasestorage.app",
  messagingSenderId: "27406176504",
  appId: "1:27406176504:web:83ac4e83cded7fa3c9eb0",
  databaseURL: "https://noxar-2f1b9-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Admin fijo
const ADMIN_USER = "Mauro";
const ADMIN_PASS = "NoxarSupremo2026";
const ADMIN_UID = "admin_mauro";

// Inicialización
async function initStructure(){
  const usersSnap = await database.ref('users').once('value');
  if(!usersSnap.exists()){
    await database.ref(`users/${ADMIN_UID}`).set({username:ADMIN_USER,role:"admin",password:ADMIN_PASS,approved:true});
    await database.ref('constitution').set({text:"1. Noxar es una nación soberana.\n2. El poder pertenece a sus ciudadanos.\n3. Mauro Suarez es el Administrador Supremo.\n4. La democracia digital es obligatoria."});
    await database.ref('votes/vote1').set({question:"¿Apruebas el sistema de Noxar?",options:["si","no"],results:{si:0,no:0},voted:[],active:true});
    await database.ref('presidentialVote').set({active:false,options:["Candidato1","Candidato2"],results:{"Candidato1":0,"Candidato2":0},voted:[]});
    await database.ref('parliament').set({members:[],chats:{}});
  }
}
initStructure();

// Login y registro
function login(){
  const u = document.getElementById('user').value;
  const p = document.getElementById('pass').value;
  if(u===ADMIN_USER && p===ADMIN_PASS){
    localStorage.setItem("session",JSON.stringify({uid:ADMIN_UID,username:ADMIN_USER,role:"admin",approved:true}));
    loadPanel(); return;
  }
  database.ref('users').orderByChild('username').equalTo(u).once('value',snap=>{
    if(!snap.exists()) return alert("Usuario no encontrado");
    const uid = Object.keys(snap.val())[0];
    const userData = snap.val()[uid];
    if(userData.password!==p) return alert("Contraseña incorrecta");
    if(!userData.approved) return alert("Usuario no aprobado");
    localStorage.setItem("session",JSON.stringify({uid,...userData}));
    loadPanel();
  });
}

function register(){
  const u = document.getElementById('newUser').value;
  const p = document.getElementById('newPass').value;
  if(u===ADMIN_USER) return alert("Usuario ya existe");
  database.ref('users').orderByChild('username').equalTo(u).once('value',snap=>{
    if(snap.exists()) return alert("Usuario ya registrado");
    const newUid = "user_"+Date.now();
    database.ref(`users/${newUid}`).set({username:u,role:"citizen",password:p,approved:false});
    alert("Registro enviado, esperando aprobación del Líder Supremo");
    showLogin();
  });
}

function logout(){localStorage.removeItem("session");location.reload();}

// Panel
function loadPanel(){
  document.getElementById('loginBox').style.display="none";
  document.getElementById('registerBox').style.display="none";
  document.getElementById('panel').style.display="block";
  const session = JSON.parse(localStorage.getItem("session"));
  document.getElementById('welcome').innerText="Usuario: "+session.username;
  if(session.role==="admin") document.getElementById('adminBtn').style.display="inline-block";
}

function showSection(id){
  document.querySelectorAll(".section").forEach(x=>x.style.display="none");
  document.getElementById(id).style.display="block";
  if(id==="admin") loadAdmin();
  if(id==="constitution") loadConstitution();
}

// Constitución editable
function loadConstitution(){
  firebase.database().ref('constitution/text').on('value',snap=>{
    document.getElementById('constitutionText').innerText = snap.val();
  });
  const session = JSON.parse(localStorage.getItem("session"));
  if(session.role==="admin"){
    document.getElementById('constitutionEdit').style.display="block";
    document.getElementById('saveConstitution').style.display="inline-block";
    firebase.database().ref('constitution/text').once('value').then(snap=>{
      document.getElementById('constitutionEdit').value = snap.val();
    });
  }
}

function editConstitution(){ loadConstitution(); }

function saveConstitution(){
  const newText = document.getElementById('constitutionEdit').value;
  database.ref('constitution/text').set(newText);
  alert("Constitución actualizada");
}
