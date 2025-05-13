const dotenv = require("dotenv");
dotenv.config();

const io = require("socket.io")(process.env.PORT, {
  cors: {
    origin: [process.env.ORIGIN],
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"],
    credentials: true,
  },
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

  // Handle WebRTC signaling events
  socket.on("call-user", ({ caller, receiverId }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("incoming-call", caller);
    }
  });

  socket.on("call-accepted", ({ to }) => {
    console.log("call-accepted block");
    const user = getUser(to);
    if (user) {
      console.log("emitting call-answered");
      io.to(user.socketId).emit("call-answered", { from: socket.id });
    }
  });

  socket.on("offer", ({ to, offer }) => {
    const user = getUser(to);
    if (user) {
      io.to(user.socketId).emit("offer-received", { from: socket.id, offer });
    }
  });

  socket.on("answer", ({ to, answer }) => {
    const user = getUser(to);
    if (user) {
      io.to(user.socketId).emit("answer-received", { answer });
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const user = getUser(to);
    if (user) {
      io.to(user.socketId).emit("ice-candidate", {
        candidate,
      });
    }
  });

  socket.on("end-call", ({ to }) => {
    const user = getUser(to);
    if (user) {
      io.to(user.socketId).emit("call-ended", { to: socket.id });
    }
  });

  //when disconnect
  socket.on("disconnect", () => {
    console.log("a user disconnected");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});
