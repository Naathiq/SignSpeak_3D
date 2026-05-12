import express from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import http from "http";
import path from "path";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" }
  });
  const PORT = Number(process.env.PORT) || 3000;

  const rooms = new Map();

  io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId, name, role) => {
      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, { host: null, users: new Map() });
      }

      const room = rooms.get(roomId);
      room.users.set(userId, { socketId: socket.id, name, role });

      if (role === "host") {
        room.host = userId;
      }

      socket.to(roomId).emit("user-connected", { userId, socketId: socket.id });
      
      const usersList = Array.from(room.users.entries()).map(([id, data]) => ({ id, ...data }));
      io.to(roomId).emit("room-users-update", usersList);

      socket.on("offer", (payload) => {
        io.to(payload.target).emit("offer", payload);
      });

      socket.on("answer", (payload) => {
        io.to(payload.target).emit("answer", payload);
      });

      socket.on("ice-candidate", (incoming) => {
        io.to(incoming.target).emit("ice-candidate", incoming);
      });

      socket.on("disconnect", () => {
        const room = rooms.get(roomId);
        if (room) {
          room.users.delete(userId);
          if (room.host === userId) {
            socket.to(roomId).emit("meeting-ended");
            rooms.delete(roomId);
          } else {
            const usersList = Array.from(room.users.entries()).map(([id, data]) => ({ id, ...data }));
            io.to(roomId).emit("room-users-update", usersList);
            socket.to(roomId).emit("user-disconnected", userId);
          }
        }
      });
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
