const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    members: {
      type: Array,
    },
    conversationId: {
      type: String,
    },
    sender: {
      type: String,
    },
    text: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
