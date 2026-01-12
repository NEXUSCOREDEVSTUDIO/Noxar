// -------------------
// FIREBASE
// -------------------
const firebaseConfig = {
  apiKey: "AIzaSyC5w3HigxtuQk_4-wwb9A8hMuIy04NXpK0",
  authDomain: "noxar-2f1b9.firebaseapp.com",
  projectId: "noxar-2f1b9",
  storageBucket: "noxar-2f1b9.firebasestorage.app",
  messagingSenderId: "27406176504",
  appId: "1:27406176504:web:83ac4e83cded7fa3c9eb0",
  measurementId: "G-D5R5RJGH40",
  databaseURL: "https://noxar-2f1b9-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// -------------------
// ADMIN FIJO
// -------------------
const ADMIN_USER = "Mauro";
const ADMIN_PASS = "NoxarSupremo2026";
const ADMIN_UID = "admin_mauro";

// -------------------
// INICIALIZACIÓN AUTOMÁTICA
// -------------------
async function initStructure(){
  const usersSnap = await database.ref('users').once('value');
  if(!usersSnap.exists()){
    // Crear admin fijo
    await database.ref(`users/${ADMIN_UID}`).set({
      username: ADMIN_USER,
      role: "admin",
      password: ADMIN_PASS,
      approved: true
    });

    // Constitución base
    await database.ref('constitution').set({
      text: "1. Noxar es una nación soberana.\n2. El poder pertenece a sus ciudadanos.\n3. Mauro Suarez es el Administrador Supremo.\n4. La democracia digital es obligatoria."
    });

    // Votación general
    await database.ref('votes/vote1').set({
      question: "¿Apruebas el sistema de Noxar?",
      options: ["si","no"],
      results: { si:0, no:0 },
      voted: [],
      active: true
    });

    // Votación presidencial
    await database.ref('presidentialVote').set({
      active: false,
      options: ["Candidato1","Candidato2"],
      results: {"Candidato1":0,"Candidato2":0},
      voted: []
    });

    // Parlamento
    await database.ref('parliament').set({ members: [], chats: {} });
  }
}
initStructure();

// -------------------
// AUTENTICACIÓN
// -------------------
function login(){
  const u = document.getElementById('user').value;
  const p = document.getElementById('pass').value;

  if(u === ADMIN_USER && p === ADMIN_PASS){
    localStorage.setItem("session", JSON.stringify({uid:ADMIN_UID,username:ADMIN_USER,role:"admin",approved:true}));
    loadPanel();
    return;
  }

  // Ciudadanos
  database.ref('users').orderByChild('username').equalTo(u).once('value',snap=>{
    if(!snap.exists()) return alert("Usuario no encontrado");
    const uid = Object.keys(snap.val())[0];
    const userData = snap.val()[uid];
    if(userData.password && userData.password!==p) return alert("Contraseña incorrecta");
    if(!userData.approved) return alert("Usuario no aprobado por el Líder Supremo");
    localStorage.setItem("session", JSON.stringify({uid, ...userData}));
    loadPanel();
  });
}

function register(){
  const u = document.getElementById('newUser').value;
  const p = document.getElementById('newPass').value;

  if(u === ADMIN_USER) return alert("Este usuario ya existe");

  database.ref('users').orderByChild('username').equalTo(u).once('value',snap=>{
    if(snap.exists()) return alert("Usuario ya registrado");
    const newUid = "user_" + Date.now();
    database.ref(`users/${newUid}`).set({username:u,role:"citizen",password:p,approved:false});
    alert("Registro enviado, esperando aprobación del Líder Supremo");
    showLogin();
  });
}

function logout(){
  localStorage.removeItem("session");
  location.reload();
}

// -------------------
// PANEL Y SECCIONES
// -------------------
function loadPanel(){
  document.getElementById('loginBox').style.display="none";
  document.getElementById('registerBox').style.display="none";
  document.getElementById('panel').style.display="block";

  const session = JSON.parse(localStorage.getItem("session"));
  document.getElementById('welcome').innerText = "Usuario: " + session.username;

  if(session.role === "admin") document.getElementById('adminBtn').style.display="inline-block";
}

function showSection(id){
  document.querySelectorAll(".section").forEach(x=>x.style.display="none");
  document.getElementById(id).style.display="block";
  if(id==="admin") loadAdmin();
  if(id==="constitution") loadConstitution();
  if(id==="vote") loadVote();
  if(id==="presidentialVote") loadPresidentialVote();
  if(id==="parliament") loadParliament();
}

function showRegister(){document.getElementById('loginBox').style.display="none"; document.getElementById('registerBox').style.display="block";}
function showLogin(){document.getElementById('registerBox').style.display="none"; document.getElementById('loginBox').style.display="block";}

// -------------------
// CONSTITUCIÓN
// -------------------
function loadConstitution(){
  firebase.database().ref('constitution/text').on('value',snap=>{
    document.getElementById('constitutionText').innerText = snap.val();
  });
}

// -------------------
// VOTACIÓN GENERAL
// -------------------
async function loadVote(){
  const snap = await database.ref('votes/vote1').once('value');
  const data = snap.val();
  document.getElementById('voteQuestion').innerText = data.question;
  const buttonsDiv = document.getElementById('voteButtons');
  buttonsDiv.innerHTML = data.options.map(o=>`<button onclick="vote('${o}')">${o}</button>`).join('');
  document.getElementById('voteResult').innerText="";
}

async function vote(option){
  const session = JSON.parse(localStorage.getItem("session"));
  const refVote = database.ref('votes/vote1');
  const snap = await refVote.once('value');
  const data = snap.val();
  if(!data.active) return alert("Votación inactiva");
  if(data.voted.includes(session.username)) return alert("Ya votaste");
  data.results[option]++;
  data.voted.push(session.username);
  await refVote.set(data);
  document.getElementById('voteResult').innerText="Voto registrado";
}

function toggleVote(active){database.ref('votes/vote1/active').set(active);}

// -------------------
// VOTACIÓN PRESIDENCIAL
// -------------------
async function loadPresidentialVote(){
  const snap = await database.ref('presidentialVote').once('value');
  const data = snap.val();
  const div = document.getElementById('presButtons');
  if(data.active){
    div.innerHTML = data.options.map(o=>`<button onclick="votePres('${o}')">${o}</button>`).join('');
  } else div.innerHTML="<p>Votación presidencial no habilitada</p>";
  document.getElementById('presVoteResult').innerText="";
}

async function votePres(option){
  const session = JSON.parse(localStorage.getItem("session"));
  const refVote = database.ref('presidentialVote');
  const snap = await refVote.once('value');
  const data = snap.val();
  if(!data.active) return alert("Votación inactiva");
  if(data.voted.includes(session.username)) return alert("Ya votaste");
  data.results[option]++;
  data.voted.push(session.username);
  await refVote.set(data);
  document.getElementById('presVoteResult').innerText="Voto registrado";
}

function togglePresidentialVote(active){database.ref('presidentialVote/active').set(active);}

// -------------------
// ADMIN PANEL
// -------------------
async function loadAdmin(){
  const usersSnap = await database.ref('users').once('value');
  const users = usersSnap.val();
  let total=0,pending=[];
  for(let uid in users){ total++; if(!users[uid].approved && users[uid].role==="citizen") pending.push({uid,username:users[uid].username}); }
  document.getElementById('totalUsers').innerText=total;
  const voteSnap = await database.ref('votes/vote1').once('value');
  document.getElementById('yesVotes').innerText=voteSnap.val().results.si;
  document.getElementById('noVotes').innerText=voteSnap.val().results.no;
  const pendDiv = document.getElementById('pendingUsers');
  pendDiv.innerHTML = pending.map(u=>`<button onclick="approveCitizen('${u.uid}')">${u.username} - Aprobar</button>`).join('');
}

async function approveCitizen(uid){
  await database.ref(`users/${uid}`).update({approved:true});
  alert("Ciudadano aprobado");
  loadAdmin();
}

// -------------------
// PARLAMENTO CHAT
// -------------------
async function loadParliament(){
  const session = JSON.parse(localStorage.getItem("session"));
  const snap = await database.ref('parliament').once('value');
  const par = snap.val();
  if(!par.members.includes(session.username) && session.username!==ADMIN_USER) return alert("No tienes acceso al parlamento");
  const chatRef = database.ref('parliament/chats/main');
  chatRef.on('value',snap=>{
    const msgs = snap.val() || [];
    document.getElementById('chatBox').innerHTML = msgs.map(m=>`<p><b>${m.sender}:</b> ${m.text}</p>`).join('');
    const box = document.getElementById('chatBox'); box.scrollTop=box.scrollHeight;
  });
}

async function sendChat(){
  const session = JSON.parse(localStorage.getItem("session"));
  const input = document.getElementById('chatInput');
  if(!input.value) return;
  const chatRef = database.ref('parliament/chats/main');
  const snap = await chatRef.once('value');
  const msgs = snap.val()||[];
  msgs.push({sender:session.username,text:input.value,timestamp:Date.now()});
  await chatRef.set(msgs);
  input.value="";
}

// -------------------
// INICIO AUTOMÁTICO
// -------------------
if(localStorage.getItem("session")) loadPanel();
