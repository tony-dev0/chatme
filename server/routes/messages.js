const router = require("express").Router();
const Message = require("../models/Message");

//add

router.post("/", async (req, res) => {
  const newMessage = new Message(req.body);

  try {
    const savedMessage = await newMessage.save();
    res.status(200).json(savedMessage);
  } catch (err) {
    res.status(500).json(err);
  }
});

//get

// router.get("/:conversationId", async (req, res) => {
//   try {
//     const messages = await Message.find({
//       conversationId: req.params.conversationId,
//     });
//     res.status(200).json(messages);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });
router.get("/:userId", async (req, res) => {
  try {
    const memberId = req.params.userId; // Get the ID from the request body

    // Find all messages where the members array contains the memberId
    const messages = await Message.find({ members: memberId });

    // Return the found messages
    return res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching messages." });
  }
});
module.exports = router;
