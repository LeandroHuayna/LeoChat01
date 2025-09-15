const socket = io({ autoConnect: false }); // No conectamos hasta login
let username = "";
let currentRoom = "";

// DOM
const loginScreen = document.getElementById("login-screen");
const roomSelectionScreen = document.getElementById("room-selection-screen");
const chatScreen = document.getElementById("chat-screen");

const usernameInput = document.getElementById("username-input");
const loginBtn = document.getElementById("login-btn");
const displayUsername = document.getElementById("display-username");
const logoutBtn = document.getElementById("logout-btn");

const publicRoomBtn = document.getElementById("public-room-btn");
const privateRoomNameInput = document.getElementById("private-room-name");
const createPrivateRoomBtn = document.getElementById("create-private-room-btn");
const joinPrivateRoomBtn = document.getElementById("join-private-room-btn");

const chatRoomName = document.getElementById("chat-room-name");
const messagesDiv = document.getElementById("messages");
const chatMessageInput = document.getElementById("chat-message-input");
const sendMessageBtn = document.getElementById("send-message-btn");
const backToRoomsBtn = document.getElementById("back-to-rooms-btn");

const loginStatus = document.getElementById("login-status");
const userStatus = document.getElementById("user-status");
const connectedUsersDiv = document.getElementById("connected-users");

const chatUserStatus = document.getElementById("chat-user-status");
const chatConnectedUsers = document.getElementById("chat-connected-users");

// ----------------- Estado de conexión -----------------
function updateStatus() {
    const online = navigator.onLine && socket.connected; // Internet y socket
    const statusText = online ? "Conectado" : "Desconectado";

    [loginStatus, userStatus, chatUserStatus].forEach(el => {
        el.textContent = statusText;
        if (!online) el.classList.add("offline");
        else el.classList.remove("offline");
    });
}

// Detectar cambios de Internet
window.addEventListener("online", updateStatus);
window.addEventListener("offline", updateStatus);

// Detectar conexión/desconexión socket
socket.on("connect", updateStatus);
socket.on("disconnect", updateStatus);

// Inicializa estado
updateStatus();

// ----------------- Login -----------------
loginBtn.addEventListener("click", login);
usernameInput.addEventListener("keypress", e => { if(e.key==="Enter") login(); });

function login(){
    const val = usernameInput.value.trim();
    if(!val) return alert("Debe ingresar un nombre de usuario");
    if(val.length>15) return alert("La sala privada debe tener máximo 15 caracteres");

    username = val;
    displayUsername.textContent = username;

    socket.connect(); // Conecta el socket al servidor
    socket.emit("set-username", username);

    loginScreen.classList.add("hidden");
    roomSelectionScreen.classList.remove("hidden");
    updateStatus();
}

// ----------------- Logout -----------------
logoutBtn.addEventListener("click", ()=>{
    if(currentRoom) socket.emit("leave-room", currentRoom);
    username="";
    usernameInput.value="";
    currentRoom="";
    roomSelectionScreen.classList.add("hidden");
    loginScreen.classList.remove("hidden");
    messagesDiv.innerHTML="";
    chatConnectedUsers.innerHTML="";
});

// ----------------- Salas -----------------
publicRoomBtn.addEventListener("click", ()=>joinRoom("Sala Pública"));
createPrivateRoomBtn.addEventListener("click", handlePrivateRoom);
joinPrivateRoomBtn.addEventListener("click", handlePrivateRoom);

function handlePrivateRoom(){
    const room = privateRoomNameInput.value.trim();
    if(room.length>=8 && room.length<=10) joinRoom(room);
    else alert("La sala privada debe tener entre 8 y 10 caracteres");
}

backToRoomsBtn.addEventListener("click", ()=>{
    if(currentRoom) socket.emit("leave-room", currentRoom);
    chatScreen.classList.add("hidden");
    roomSelectionScreen.classList.remove("hidden");
    messagesDiv.innerHTML="";
    chatConnectedUsers.innerHTML="";
    currentRoom="";
});

// ----------------- Función unir sala -----------------
function joinRoom(room){
    if(currentRoom) socket.emit("leave-room", currentRoom);
    currentRoom = room;
    chatRoomName.textContent = room;
    roomSelectionScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");
    messagesDiv.innerHTML="";
    chatConnectedUsers.innerHTML="";
    socket.emit("join-room", room);
}

// ----------------- Chat -----------------
sendMessageBtn.addEventListener("click", sendMessage);
chatMessageInput.addEventListener("keypress", e => { if(e.key==="Enter") sendMessage(); });

function sendMessage(){
    const msg = chatMessageInput.value.trim();
    if(!msg) return;
    socket.emit("chat-message",{room:currentRoom, username, message: msg});
    chatMessageInput.value="";
}

// ----------------- Socket.IO -----------------
socket.on("chat-message", data=>{
    const msgElem = document.createElement("div");
    if(data.username==="Sistema"){
        msgElem.style.color="#50fa7b";
        msgElem.style.fontStyle="italic";
    }
    msgElem.textContent = `${data.username}: ${data.message}`;
    messagesDiv.appendChild(msgElem);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// ----------------- Lista usuarios conectados -----------------
// Pantalla selección
socket.on("update-user-list", users=>{
    connectedUsersDiv.innerHTML="";
    users.forEach(u=>{
        const div = document.createElement("div");
        div.classList.add("user");
        const name = document.createElement("span");
        name.textContent = u.username;
        const status = document.createElement("span");
        status.textContent = u.online ? "Conectado":"Desconectado";
        status.classList.add("status-text");
        if(!u.online) status.classList.add("offline");
        div.appendChild(name);
        div.appendChild(status);
        connectedUsersDiv.appendChild(div);
    });
});

// Pantalla chat
socket.on("update-room-users", users=>{
    chatConnectedUsers.innerHTML="";
    users.sort((a,b)=>a.username===username?-1:1); // tu usuario primero
    users.forEach(u=>{
        const div = document.createElement("div");
        div.classList.add("user");
        const name = document.createElement("span");
        name.textContent = u.username;
        const status = document.createElement("span");
        status.textContent = u.online ? "Conectado":"Desconectado";
        status.classList.add("status-text");
        if(!u.online) status.classList.add("offline");
        div.appendChild(name);
        div.appendChild(status);
        chatConnectedUsers.appendChild(div);
    });
});
