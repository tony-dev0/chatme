const User = require("../models/User");
const router = require("express").Router();
const bcrypt = require("bcrypt");

//update user
router.put("/:id", async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    if (req.body.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      } catch (err) {
        return res.status(500).json(err);
      }
    }
    try {
      const user = await User.findByIdAndUpdate(req.params.id, {
        $set: req.body,
      });
      res.status(200).json("Account has been updated");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can update only your account!");
  }
});

//delete user
router.delete("/:id", async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json("Account has been deleted");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can delete only your account!");
  }
});

//get a user
router.get("/", async (req, res) => {
  const userId = req.query.userId;
  try {
    const user = await User.findById(userId);

    const { password, updatedAt, ...other } = user._doc;
    res.status(200).json(other);
  } catch (err) {
    console.log(err);
  }
});

//get friends
router.get("/friends/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const friends = await Promise.all(
      user.friends.map((friendId) => {
        return User.findById(friendId);
      })
    );
    let friendList = [];
    friends.map((friend) => {
      const { _id, username, email, profilePic } = friend;
      friendList.push({ _id, username, email, profilePic });
    });
    res.status(200).json(friendList);
  } catch (err) {
    res.status(500).json(err);
  }
});

// send a friend request
router.patch("/:id/request", async (req, res) => {
  const userId = req.params.id;
  const friendName = req.body.username;
  try {
    const user = await User.findById(userId);
    const requestedFriend = await User.findOne({ username: friendName });
    // check if requested friend exist
    if (!requestedFriend) {
      return res.status(403).json("no such user");
    }
    // check if id is different from user
    if (requestedFriend._id == userId) {
      return res.status(403).json("you cant add yourself");
    }
    // check if already friends with user
    if (requestedFriend.friends.includes(user._id)) {
      return res.status(403).json("already friends with user");
    }
    // send friend request only if you havent sent before
    if (requestedFriend.friendRequests.includes(userId)) {
      return res.status(403).json("friend request already sent");
    }
    // send friend request only if havent recieved a friend request by the user
    if (user.friendRequests.includes(requestedFriend._id)) {
      return res.status(403).json(`Accept ${friendName} Request to be friends`);
    }
    await requestedFriend.updateOne({ $push: { friendRequests: userId } });
    res.status(200).json("friend request sent to user");
  } catch (err) {
    console.log(err);
    res.status(403).json("an error occurred");
  }
});

// get all user that sent friend request
router.get("/:userId/requests", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const userDetails = await Promise.all(
      user.friendRequests.map((friendId) => {
        return User.findById(friendId);
      })
    );
    let friendRequestList = [];
    userDetails.map((userDetail) => {
      const { _id, username, email, profilePic } = userDetail;
      friendRequestList.push({ _id, username, email, profilePic });
    });
    res.status(200).json(friendRequestList);
  } catch (err) {
    res.status(500).json(err);
  }
});

// accept friend Request
router.patch("/acceptRequest/:userId", async (req, res) => {
  try {
    //remove requestid from friendRequestid array
    await User.updateOne(
      { _id: req.body.id },
      { $pull: { friendRequests: req.params.userId } }
    );
    // add the id to list of friends
    await User.updateOne(
      { _id: req.body.id },
      { $push: { friends: req.params.userId } }
    );
    // update the senders friends
    await User.updateOne(
      { _id: req.params.userId },
      { $push: { friends: req.body.id } }
    );
    res.status(200).json("Accepted!");
  } catch (err) {
    res.status(500).json(err);
  }
});

// decline friend Request
router.patch("/declineRequest/:userId", async (req, res) => {
  try {
    //remove requestid from friendRequestid array
    await User.updateOne(
      { _id: req.body.id },
      { $pull: { friendRequests: req.params.userId } }
    );
    res.status(200).json("Declined!");
  } catch (err) {
    res.status(500).json(err);
  }
});

// delete friend
router.patch("/deleteFriend/:friendId", async (req, res) => {
  const userId = req.body.userId;
  const friendId = req.params.friendId;
  try {
    const user = await User.findById(userId);
    await user.updateOne({ $pull: { friends: friendId } });

    const friend = User.findById(friendId);
    await friend.updateOne({ $pull: { friends: userId } });

    res.status(200).json("contact removed");
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
