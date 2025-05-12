const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan"); // Add morgan for HTTP request logging
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const messageRoute = require("./routes/messages");

dotenv.config();

const corsOptions = {
  // origin: [process.env.ORIGIN],
  origin: "*",
  methods: ["POST", "GET", "PUT", "PATCH", "DELETE"],
};

const uri = process.env.MONGO_URL;
const connect = async () => {
  try {
    await mongoose.connect(uri);
    console.log("connected to mongoDB");
  } catch (err) {
    throw err;
  }
};

//middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(helmet());
app.use(morgan("dev")); // Use morgan middleware for logging

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/messages", messageRoute);

mongoose.connection.on("disconnected", () => {
  console.log("mongoDB disconnected");
});
mongoose.connection.on("connected", () => {
  console.log("mongoDB connected");
});
mongoose.connection.on("error", (err) => {
  console.log("mongoDB ERR - ", err);
  return res.status(500).json("An error occurred in mongoDB");
});

app.listen(8000, () => {
  connect();
  console.log("Backend server is running!");
});
