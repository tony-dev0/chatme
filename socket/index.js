const https = require("https");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const options = {
  key: fs.readFileSync("cert/cert.key"),
  cert: fs.readFileSync("cert/cert.crt"),
};

const httpsServer = https
  .createServer(options, (req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello, this is a secure socket server!\n");
  })
  .listen(process.env.PORT, () => {
    console.log(`Socket Server is running on port ${process.env.PORT}`);
  });
const io = require("socket.io")(httpsServer, {
  cors: {
    origin: [process.env.ORIGIN, process.env.MOBILE_ORIGIN],
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"],
    credentials: true,
  },
  method: ["GET", "POST"],
});

let users = [];

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  //when ceonnect
  console.log("a user connected.");

  //take userId and socketId from user
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  //send and get message
  socket.on("sendMessage", ({ senderId, receiverId, text, members }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("getMessage", {
        senderId,
        members,
        text,
      });
    }
  });

  // Add typing and stopTyping events
  socket.on("typing", ({ senderId, receiverId }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("typing", { senderId });
    }
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("stopTyping", { senderId });
    }
  });

  // video call signaling events
  socket.on("video-call-offer", ({ receiverId, caller, offer }) => {
    console.log(caller);
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("video-call-offer", { caller, offer });
    }
  });

  socket.on("video-call-answer", ({ to, answer }) => {
    const user = getUser(to);
    if (user) {
      io.to(user.socketId).emit("video-call-answer", {
        answer,
      });
    }
  });

  socket.on("video-call-ice-candidate", ({ to, candidate }) => {
    const user = getUser(to);
    if (user) {
      io.to(user.socketId).emit("video-call-ice-candidate", {
        candidate,
      });
    }
  });
  socket.on("video-call-completed", ({ to }) => {
    const user = getUser(to);
    if (user) {
      io.to(user.socketId).emit("video-call-completed", { to: socket.id });
    }
  });
  socket.on("end-video-call", ({ to }) => {
    const user = getUser(to);
    if (user) {
      io.to(user.socketId).emit("video-call-ended", { to: socket.id });
    }
  });
  // voice call signaling events
  socket.on("voice-call-offer", ({ receiverId, caller, offer }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("voice-call-offer", { caller, offer });
    }
  });

  socket.on("voice-call-answer", ({ to, answer }) => {
    const user = getUser(to);
    if (user) {
      io.to(user.socketId).emit("voice-call-answer", {
        answer,
      });
    }
  });

  socket.on("voice-call-ice-candidate", ({ to, candidate }) => {
    const user = getUser(to);
    if (user) {
      io.to(user.socketId).emit("voice-call-ice-candidate", {
        candidate,
      });
    }
  });
  socket.on("voice-call-completed", ({ to }) => {
    const user = getUser(to);
    if (user) {
      io.to(user.socketId).emit("voice-call-completed", { to: socket.id });
    }
  });
  socket.on("end-voice-call", ({ to }) => {
    const user = getUser(to);
    if (user) {
      io.to(user.socketId).emit("voice-call-ended", { to: socket.id });
    }
  });

  //when disconnect
  socket.on("disconnect", () => {
    console.log("a user disconnected");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});

//
