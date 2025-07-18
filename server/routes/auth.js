const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");

//REGISTER
router.post("/register", async (req, res) => {
  try {
    const findUser = await User.findOne({ email: req.body.email });
    // Check if user exists
    if (findUser) {
      return res.status(500).json("User already exist"); // Return here
    }
    //generate new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    let profilePic;

    // assign default profile pic based on gender
    req.body.gender == "male"
      ? (profilePic = "../assets/avatars/male.jpg")
      : (profilePic = "../assets/avatars/female.jpg");

    //create new user
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      gender: req.body.gender,
      password: hashedPassword,
      profilePic: profilePic,
    });

    //save user and respond
    const user = await newUser.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

//LOGIN
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    // Check if user exists
    if (!user) {
      return res.status(404).json("User not found"); // Return here
    }
    // Check if password is valid
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword) {
      return res.status(400).json("Wrong password"); // Return here
    }
    // If the password is valid, remove the password field from the user object
    const { password, createdAt, ...others } = user._doc;

    // If everything is fine, send the user object
    res.status(200).json(others);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
