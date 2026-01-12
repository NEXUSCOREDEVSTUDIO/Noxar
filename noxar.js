const ADMIN = {user:"Mauro", pass:"NoxarSupremo2026", role:"president"};

if(!localStorage.users){
  localStorage.users = JSON.stringify([ADMIN]);
}

if(!localStorage.constitution){
  localStorage.constitution = `
ARTÍCULO 1 – Noxar es una nación digital soberana.
ARTÍCULO 2 – El poder emana de sus ciudadanos.
ARTÍCULO 3 – Mauro Suarez es el Administrador Supremo.
ARTÍCULO 4 – La democracia digital es obligatoria.
ARTÍCULO 5 – El idioma oficial es el Noxari.
`;
}

if(!localStorage.votes){
  localStorage.votes = JSON.stringify({yes:0,no:0,voted:[]});
}

function login(){
  let u=user.value,p=pass.value;
  let users=JSON.parse(localStorage.users);
  let found=users.find(x=>x.user==u && x.pass==p);
  if(!found) return alert("Acceso denegado");

  localStorage.session=JSON.stringify(found);
  loadPortal();
}

function loadPortal(){
  loginBox.style.display="none";
  portal.style.display="flex";
  let s=JSON.parse(localStorage.session);

  who.innerText = s.user;
  idCard.innerHTML = `
    <p>Nombre: ${s.user}</p>
    <p>Rol: ${s.role}</p>
    <p>ID Noxar: NX-${Math.floor(Math.random()*99999)}</p>
  `;

  lawText.value = localStorage.constitution;

  if(s.role=="president"){
    adminBtn.style.display="block";
    saveLaw.style.display="block";
  } else {
    saveLaw.style.display="none";
  }
}

function show(id){
  document.querySelectorAll("section").forEach(s=>s.style.display="none");
  document.getElementById(id).style.display="block";
  if(id=="admin") loadAdmin();
}

function saveConstitution(){
  localStorage.constitution = lawText.value;
  alert("Constitución actualizada");
}

function vote(v){
  let s=JSON.parse(localStorage.session);
  let data=JSON.parse(localStorage.votes);
  if(data.voted.includes(s.user)) return alert("Ya votaste");
  data[v]++;
  data.voted.push(s.user);
  localStorage.votes=JSON.stringify(data);
  voteStatus.innerText="Voto registrado";
}

function loadAdmin(){
  let users=JSON.parse(localStorage.users);
  let v=JSON.parse(localStorage.votes);
  citizens.innerText = users.length;
  vYes.innerText = v.yes;
  vNo.innerText = v.no;
}

function logout(){
  localStorage.removeItem("session");
  location.reload();
}

if(localStorage.session) loadPortal();
