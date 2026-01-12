const ADMIN_USER = "Mauro";
const ADMIN_PASS = "NoxarSupremo2026";

if(!localStorage.users){
    localStorage.users = JSON.stringify([{user:ADMIN_USER, pass:ADMIN_PASS, role:"admin"}]);
}

if(!localStorage.votes){
    localStorage.votes = JSON.stringify({si:0,no:0, voted:[]});
}

function login(){
    let u = user.value;
    let p = pass.value;
    let users = JSON.parse(localStorage.users);

    let found = users.find(x=>x.user==u && x.pass==p);
    if(found){
        localStorage.session = JSON.stringify(found);
        loadPanel();
    }else alert("Datos incorrectos");
}

function register(){
    let u = newUser.value;
    let p = newPass.value;
    let users = JSON.parse(localStorage.users);

    if(users.find(x=>x.user==u)) return alert("Usuario existe");

    users.push({user:u,pass:p,role:"citizen"});
    localStorage.users = JSON.stringify(users);
    alert("Registrado");
    showLogin();
}

function loadPanel(){
    loginBox.style.display="none";
    registerBox.style.display="none";
    panel.style.display="block";

    let s = JSON.parse(localStorage.session);
    welcome.innerText = "Ciudadano: "+s.user;

    if(s.role=="admin") adminBtn.style.display="inline-block";
}

function showSection(id){
    document.querySelectorAll(".section").forEach(x=>x.style.display="none");
    document.getElementById(id).style.display="block";

    if(id=="admin") loadAdmin();
}

function logout(){
    localStorage.removeItem("session");
    location.reload();
}

function showRegister(){
    loginBox.style.display="none";
    registerBox.style.display="block";
}
function showLogin(){
    registerBox.style.display="none";
    loginBox.style.display="block";
}

function vote(v){
    let s = JSON.parse(localStorage.session);
    let data = JSON.parse(localStorage.votes);

    if(data.voted.includes(s.user)) return alert("Ya votaste");

    data[v]++;
    data.voted.push(s.user);
    localStorage.votes = JSON.stringify(data);

    voteResult.innerText = "Voto registrado";
}

function loadAdmin(){
    let users = JSON.parse(localStorage.users);
    let v = JSON.parse(localStorage.votes);

    totalUsers.innerText = users.length;
    yesVotes.innerText = v.si;
    noVotes.innerText = v.no;
}

if(localStorage.session){
    loadPanel();
}
