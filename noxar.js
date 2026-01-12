// noxar.js
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getDatabase, ref, set, get, update, onValue, push } from "firebase/database";

// -------------------
// CONFIG FIREBASE
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// -------------------
// CONSTANTES
// -------------------
const ADMIN_USER = "Mauro";
const ADMIN_PASS = "NoxarSupremo2026";

// -------------------
// INICIALIZACIÓN AUTOMÁTICA
// -------------------
async function initStructure() {
  const usersSnap = await get(ref(database, 'users'));
  if (!usersSnap.exists()) {
    // Crear admin Líder Supremo
    const adminUser = await createUserWithEmailAndPassword(auth, "admin@noxar.com", ADMIN_PASS);
    await set(ref(database, `users/${adminUser.user.uid}`), {
      username: ADMIN_USER,
      role: "admin",
      approved: true
    });

    // Constitución base
    await set(ref(database, 'constitution'), {
      text: "1. Noxar es una nación soberana.\n2. El poder pertenece a sus ciudadanos.\n3. Mauro Suarez es el Administrador Supremo.\n4. La democracia digital es obligatoria."
    });

    // Votación general
    await set(ref(database, 'votes/vote1'), {
      question: "¿Apruebas el sistema de Noxar?",
      options: ["si","no"],
      results: { si: 0, no: 0 },
      active: true,
      voted: []
    });

    // Votación presidencial
    await set(ref(database, 'presidentialVote'), {
      active: false,
      options: ["Candidato1","Candidato2"],
      results: { "Candidato1":0, "Candidato2":0 },
      voted: []
    });

    // Parlamento
    await set(ref(database, 'parliament'), {
      members: [],
      chats: {}
    });
  }
}

initStructure();

// -------------------
// AUTENTICACIÓN
// -------------------
async function login(){
  const u = user.value;
  const p = pass.value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, u+"@noxar.com", p);
    const uid = userCredential.user.uid;
    const snapshot = await get(ref(database, `users/${uid}`));
    const userData = snapshot.val();

    if(!userData.approved) return alert("Usuario no aprobado por el Líder Supremo");

    localStorage.setItem("session", JSON.stringify({uid, ...userData}));
    loadPanel();
  } catch(e) {
    alert("Usuario o contraseña incorrectos");
  }
}

async function register(){
  const u = newUser.value;
  const p = newPass.value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, u+"@noxar.com", p);
    const uid = userCredential.user.uid;
    // Guardar como ciudadano pendiente
    await set(ref(database, `users/${uid}`), {
      username: u,
      role: "citizen",
      approved: false
    });
    alert("Registro enviado, esperando aprobación del Líder Supremo");
    showLogin();
  } catch(e) {
    alert("Error en registro: " + e.message);
  }
}

function logout(){
  signOut(auth);
  localStorage.removeItem("session");
  location.reload();
}

// -------------------
// PANEL Y SECCIONES
// -------------------
async function loadPanel(){
  loginBox.style.display="none";
  registerBox.style.display="none";
  panel.style.display="block";

  const session = JSON.parse(localStorage.getItem("session"));
  welcome.innerText = "Usuario: " + session.username;

  if(session.role === "admin") adminBtn.style.display = "inline-block";
}

function showSection(id){
  document.querySelectorAll(".section").forEach(x=>x.style.display="none");
  document.getElementById(id).style.display="block";

  if(id === "admin") loadAdmin();
  if(id === "constitution") loadConstitution();
  if(id === "vote") loadVote();
  if(id === "presidentialVote") loadPresidentialVote();
  if(id === "parliament") loadParliament();
}

// -------------------
// CONSTITUCIÓN
// -------------------
function loadConstitution(){
  const constRef = ref(database, 'constitution/text');
  onValue(constRef, snapshot=>{
    const sec = document.getElementById('constitution');
    sec.innerHTML = `<h2>Constitución</h2><p>${snapshot.val()}</p>`;
  });
}

async function updateConstitution(newText){
  await set(ref(database,'constitution/text'), newText);
}

// -------------------
// VOTACIONES
// -------------------
async function loadVote(){
  const voteSnap = await get(ref(database,'votes/vote1'));
  const data = voteSnap.val();
  voteResult.innerText = `Sí: ${data.results.si}, No: ${data.results.no}`;
}

async function vote(option){
  const session = JSON.parse(localStorage.getItem("session"));
  const voteRef = ref(database,'votes/vote1');
  const snapshot = await get(voteRef);
  const data = snapshot.val();

  if(!data.active) return alert("La votación no está activa");
  if(data.voted.includes(session.username)) return alert("Ya votaste");

  data.results[option]++;
  data.voted.push(session.username);
  await set(voteRef, data);

  voteResult.innerText = "Voto registrado";
}

function toggleVote(active){
  set(ref(database,'votes/vote1/active'), active);
}

// -------------------
// VOTACIÓN PRESIDENCIAL
// -------------------
async function loadPresidentialVote(){
  const voteSnap = await get(ref(database,'presidentialVote'));
  const data = voteSnap.val();
  const sec = document.getElementById('vote');
  sec.innerHTML = `<h2>Votación Presidencial</h2>
  ${data.active ? data.options.map(opt=>`<button onclick="votePres('${opt}')">${opt}</button>`).join('') : '<p>Votación no habilitada</p>'}
  <p id="voteResult"></p>`;
}

async function votePres(option){
  const session = JSON.parse(localStorage.getItem("session"));
  const voteRef = ref(database,'presidentialVote');
  const snapshot = await get(voteRef);
  const data = snapshot.val();

  if(!data.active) return alert("Votación presidencial no activa");
  if(data.voted.includes(session.username)) return alert("Ya votaste");

  data.results[option]++;
  data.voted.push(session.username);
  await set(voteRef,data);
  voteResult.innerText = "Voto registrado";
}

function togglePresidentialVote(active){
  set(ref(database,'presidentialVote/active'),active);
}

// -------------------
// ADMIN PANEL
// -------------------
async function loadAdmin(){
  const usersSnap = await get(ref(database,'users'));
  const usersData = usersSnap.val();
  let total = 0;
  let pending = [];
  for(let uid in usersData){
    total++;
    if(!usersData[uid].approved && usersData[uid].role === "citizen") pending.push({uid, username: usersData[uid].username});
  }

  totalUsers.innerText = total;

  // Mostrar pendientes
  const adminSec = document.getElementById('admin');
  adminSec.innerHTML = `<h2>Panel Líder Supremo</h2>
  <p>Total ciudadanos: ${total}</p>
  <p>Usuarios pendientes:</p>
  ${pending.map(u=>`<button onclick="approveCitizen('${u.uid}')">${u.username} - Aprobar</button>`).join('')}`;

  // Cargar votación
  const voteSnap = await get(ref(database,'votes/vote1'));
  yesVotes.innerText = voteSnap.val().results.si;
  noVotes.innerText = voteSnap.val().results.no;
}

// Aprobar ciudadano
async function approveCitizen(uid){
  await update(ref(database, `users/${uid}`), { approved: true });
  alert("Ciudadano aprobado");
  loadAdmin();
}

// -------------------
// PARLAMENTO Y CHAT EN TIEMPO REAL
// -------------------
async function loadParliament(){
  const session = JSON.parse(localStorage.getItem("session"));
  const parSnap = await get(ref(database,'parliament'));
  const par = parSnap.val();

  if(![...par.members,ADMIN_USER].includes(session.username)) return alert("No tienes acceso al parlamento");

  const sec = document.getElementById('parliament');
  sec.innerHTML = `<h2>Parlamento</h2>
  <div id="chatBox" style="height:200px;overflow:auto;background:#111;padding:5px;"></div>
  <input id="chatInput" placeholder="Escribe un mensaje"><button onclick="sendChat()">Enviar</button>`;

  const chatRef = ref(database,'parliament/chats/main');
  onValue(chatRef, snapshot=>{
    const messages = snapshot.val() || [];
    const box = document.getElementById('chatBox');
    box.innerHTML = messages.map(m=>`<p><b>${m.sender}:</b> ${m.text}</p>`).join('');
    box.scrollTop = box.scrollHeight;
  });
}

async function sendChat(){
  const session = JSON.parse(localStorage.getItem("session"));
  const input = document.getElementById('chatInput');
  if(!input.value) return;

  const chatRef = ref(database,'parliament/chats/main');
  const snapshot = await get(chatRef);
  const messages = snapshot.val() || [];
  messages.push({sender: session.username, text: input.value, timestamp: Date.now()});
  await set(chatRef,messages);
  input.value="";
}

// -------------------
// INICIO AUTOMÁTICO
// -------------------
if(localStorage.getItem("session")) loadPanel();

