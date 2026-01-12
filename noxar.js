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

// Roles con acceso a parlamento
const POLITICAL_ROLES = ["admin", "parliament", "prime_minister"];

// -------------------
// INICIALIZACIÓN AUTOMÁTICA
// -------------------
async function initStructure() {
  const usersSnap = await database.ref('users').once('value');
  if (!usersSnap.exists()) {
    await database.ref(`users/${ADMIN_UID}`).set({
      username: ADMIN_USER,
      role: "admin",
      password: ADMIN_PASS,
      approved: true
    });
    await database.ref('constitution').set({
      text: "1. Noxar es una nación soberana.\n2. El poder pertenece a sus ciudadanos.\n3. Mauro Suarez es el Administrador Supremo.\n4. La democracia digital es obligatoria."
    });
    await database.ref('votes/vote1').set({
      question: "¿Apruebas el sistema de Noxar?",
      options: ["si", "no"],
      results: { si: 0, no: 0 },
      voted: [],
      active: true
    });
    await database.ref('presidentialVote').set({
      active: false,
      options: [],
      results: {},
      voted: []
    });
    await database.ref('parliament').set({ members: [], chats: [] });
  }
}
initStructure();

// -------------------
// LOGIN Y REGISTRO
// -------------------
function login() {
  const u = document.getElementById('user').value;
  const p = document.getElementById('pass').value;

  if (u === ADMIN_USER && p === ADMIN_PASS) {
    localStorage.setItem("session", JSON.stringify({ uid: ADMIN_UID, username: ADMIN_USER, role: "admin", approved: true }));
    loadPanel(); return;
  }

  database.ref('users').orderByChild('username').equalTo(u).once('value', snap => {
    if (!snap.exists()) return alert("Usuario no encontrado");
    const uid = Object.keys(snap.val())[0];
    const userData = snap.val()[uid];
    if (userData.password !== p) return alert("Contraseña incorrecta");
    if (!userData.approved) return alert("Usuario no aprobado");
    localStorage.setItem("session", JSON.stringify({ uid, ...userData }));
    loadPanel();
  });
}

function register() {
  const u = document.getElementById('newUser').value;
  const p = document.getElementById('newPass').value;
  if (u === ADMIN_USER) return alert("Usuario ya existe");
  database.ref('users').orderByChild('username').equalTo(u).once('value', snap => {
    if (snap.exists()) return alert("Usuario ya registrado");
    const newUid = "user_" + Date.now();
    database.ref(`users/${newUid}`).set({ username: u, role: "citizen", password: p, approved: false });
    alert("Registro enviado, esperando aprobación del Líder Supremo");
    showLogin();
  });
}

function logout() { localStorage.removeItem("session"); location.reload(); }

// -------------------
// PANEL Y SECCIONES
// -------------------
function loadPanel() {
  document.getElementById('loginBox').style.display = "none";
  document.getElementById('registerBox').style.display = "none";
  document.getElementById('panel').style.display = "block";

  const session = JSON.parse(localStorage.getItem("session"));
  document.getElementById('welcome').innerText = "Usuario: " + session.username;
  if (session.role === "admin") document.getElementById('adminBtn').style.display = "inline-block";
}

function showSection(id) {
  document.querySelectorAll(".section").forEach(x => x.style.display = "none");
  document.getElementById(id).style.display = "block";
  if (id === "admin") loadAdmin();
  if (id === "constitution") loadConstitution();
  if (id === "vote") loadVote();
  if (id === "presidentialVote") loadPresidentialVote();
  if (id === "parliament") loadParliament();
}

// -------------------
// CONSTITUCIÓN
// -------------------
function loadConstitution() {
  firebase.database().ref('constitution/text').on('value', snap => {
    document.getElementById('constitutionText').innerText = snap.val();
  });
  const session = JSON.parse(localStorage.getItem("session"));
  if (session.role === "admin") {
    document.getElementById('constitutionEdit').style.display = "block";
    document.getElementById('saveConstitution').style.display = "inline-block";
    firebase.database().ref('constitution/text').once('value').then(snap => {
      document.getElementById('constitutionEdit').value = snap.val();
    });
  }
}

function saveConstitution() {
  const newText = document.getElementById('constitutionEdit').value;
  database.ref('constitution/text').set(newText);
  alert("Constitución actualizada");
}

// -------------------
// VOTACIÓN GENERAL
// -------------------
async function loadVote() {
  const snap = await database.ref('votes/vote1').once('value');
  const data = snap.val();
  document.getElementById('voteQuestion').innerText = data.question;
  const buttonsDiv = document.getElementById('voteButtons');
  buttonsDiv.innerHTML = data.options.map(o => `<button onclick="vote('${o}')">${o}</button>`).join('');
  document.getElementById('voteResult').innerText = "";
}

async function vote(option) {
  const session = JSON.parse(localStorage.getItem("session"));
  const refVote = database.ref('votes/vote1');
  const snap = await refVote.once('value');
  const data = snap.val();
  if (!data.active) return alert("Votación inactiva");
  if (data.voted.includes(session.username)) return alert("Ya votaste");
  data.results[option]++;
  data.voted.push(session.username);
  await refVote.set(data);
  document.getElementById('voteResult').innerText = "Voto registrado";
}

function toggleVote(active) { database.ref('votes/vote1/active').set(active); }

// -------------------
// VOTACIÓN PRESIDENCIAL
// -------------------
async function loadPresidentialVote() {
  const snap = await database.ref('presidentialVote').once('value');
  const data = snap.val();
  const div = document.getElementById('presButtons');
  const session = JSON.parse(localStorage.getItem("session"));
  if (session.role === "admin") {
    const name = prompt("Agregar candidato presidencial:");
    if (name && !data.options.includes(name)) {
      data.options.push(name);
      data.results[name] = 0;
      await database.ref('presidentialVote').set(data);
      alert("Candidato agregado");
    }
  }
  if (data.active) {
    div.innerHTML = data.options.map(o => `<button onclick="votePres('${o}')">${o}</button>`).join('');
  } else div.innerHTML = "<p>Votación presidencial no habilitada</p>";
  document.getElementById('presVoteResult').innerText = "";
}

async function votePres(option) {
  const session = JSON.parse(localStorage.getItem("session"));
  const refVote = database.ref('presidentialVote');
  const snap = await refVote.once('value');
  const data = snap.val();
  if (!data.active) return alert("Votación inactiva");
  if (data.voted.includes(session.username)) return alert("Ya votaste");
  data.results[option]++;
  data.voted.push(session.username);
  await refVote.set(data);
  document.getElementById('presVoteResult').innerText = "Voto registrado";
}

function togglePresidentialVote(active) { database.ref('presidentialVote/active').set(active); }

// -------------------
// ADMIN PANEL CON RANGOS
// -------------------
async function loadAdmin() {
  const usersSnap = await database.ref('users').once('value');
  const users = usersSnap.val();
  let total = 0;
  const adminTable = document.getElementById('pendingUsers');
  adminTable.innerHTML = "";

  for (let uid in users) {
    total++;
    const u = users[uid];
    let line = document.createElement("div");
    line.innerHTML = `${u.username} (${u.role})`;
    if (!u.approved && u.role === "citizen") {
      const approveBtn = document.createElement("button");
      approveBtn.innerText = "Aprobar";
      approveBtn.onclick = () => approveCitizen(uid);
      line.appendChild(approveBtn);
    }
    if (JSON.parse(localStorage.getItem("session")).role === "admin") {
      const roleBtn = document.createElement("button");
      roleBtn.innerText = "Asignar rol";
      roleBtn.onclick = () => assignRole(uid);
      line.appendChild(roleBtn);
    }
    adminTable.appendChild(line);
  }

  document.getElementById('totalUsers').innerText = total;

  const voteSnap = await database.ref('votes/vote1').once('value');
  document.getElementById('yesVotes').innerText = voteSnap.val().results.si;
  document.getElementById('noVotes').innerText = voteSnap.val().results.no;
}

async function approveCitizen(uid) {
  await database.ref(`users/${uid}`).update({ approved: true });
  alert("Ciudadano aprobado");
  loadAdmin();
}

async function assignRole(uid) {
  const session = JSON.parse(localStorage.getItem("session"));
  if (session.role !== "admin") return alert("Solo el Líder Supremo puede asignar roles");
  const role = prompt("Asignar rol (citizen/parliament/prime_minister/president):");
  if (!["citizen", "parliament", "prime_minister", "president"].includes(role)) return alert("Rol inválido");
  await database.ref(`users/${uid}`).update({ role });
  alert("Rol asignado");
  loadAdmin();
}

// -------------------
// PARLAMENTO CHAT EN TIEMPO REAL SOLO PARA ROLES POLÍTICOS
// -------------------
async function loadParliament() {
  const session = JSON.parse(localStorage.getItem("session"));

  // Verifica si tiene rol político
  if (!POLITICAL_ROLES.includes(session.role)) {
    alert("No tienes acceso al parlamento");
    document.getElementById('parliament').style.display = "none";
    return;
  }

  document.getElementById('parliament').style.display = "block";

  // Listener en tiempo real
  const chatRef = database.ref('parliament/chats/main');
  chatRef.on('value', snap => {
    const msgs = snap.val() || [];
    document.getElementById('chatBox').innerHTML = msgs
      .map(m => `<p><b>${m.sender}:</b> ${m.text}</p>`)
      .join('');
    document.getElementById('chatBox').scrollTop = document.getElementById('chatBox').scrollHeight;
  });
}

async function sendChat() {
  const session = JSON.parse(localStorage.getItem("session"));

  if (!POLITICAL_ROLES.includes(session.role)) return alert("No tienes permiso para enviar mensajes");

  const input = document.getElementById('chatInput');
  if (!input.value) return;

  const chatRef = database.ref('parliament/chats/main');
  chatRef.transaction(msgs => {
    if (msgs === null) msgs = [];
    msgs.push({ sender: session.username, text: input.value, timestamp: Date.now() });
    return msgs;
  });

  input.value = "";
}

// -------------------
// INICIO AUTOMÁTICO
if (localStorage.getItem("session")) loadPanel();
