const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      require: true,
      min: 3,
      max: 20,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      max: 50,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
    },
    gender: {
      type: String,
      default: "male",
    },
    profilePic: {
      type: String,
      default: "../assets/avatars/default.jpg",
    },
    friends: {
      type: Array,
      default: [],
    },
    friendRequests: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
