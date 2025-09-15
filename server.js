const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

let users = []; // {id, username, online, room}

io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);

    // Guardar nombre
    socket.on("set-username", (username) => {
        const existing = users.find(u => u.id === socket.id);
        if(!existing) users.push({id: socket.id, username, online: true, room: null});
        else existing.online = true;

        // Emitir solo usuarios online
        io.emit("update-user-list", users.filter(u => u.online));
    });

    // Unirse a sala
    socket.on("join-room", (room) => {
        socket.join(room);
        const user = users.find(u => u.id === socket.id);
        if(user) user.room = room;

        socket.to(room).emit("chat-message", { username: "Sistema", message: `${user.username} se ha unido a la sala` });

        // Emitir solo usuarios online de la sala
        const roomUsers = users.filter(u => u.room === room && u.online);
        io.to(room).emit("update-room-users", roomUsers);
    });

    // Salir de sala
    socket.on("leave-room", (room) => {
        socket.leave(room);
        const user = users.find(u => u.id === socket.id);
        if(user) user.room = null;

        const roomUsers = users.filter(u => u.room === room && u.online);
        io.to(room).emit("update-room-users", roomUsers);
    });

    // Mensajes de chat
    socket.on("chat-message", ({room, username, message}) => {
        io.to(room).emit("chat-message", { username, message });
    });

    // Desconexión
    socket.on("disconnect", () => {
        const user = users.find(u => u.id === socket.id);
        if(user) user.online = false;

        // Emitir solo usuarios online
        io.emit("update-user-list", users.filter(u => u.online));

        if(user && user.room){
            io.to(user.room).emit("update-room-users", users.filter(u => u.room === user.room && u.online));
            io.to(user.room).emit("chat-message", { username: "Sistema", message: `${user.username} se ha desconectado` });
        }

        console.log(`Cliente desconectado: ${user ? user.username : socket.id}`);
    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
