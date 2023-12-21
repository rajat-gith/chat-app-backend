const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

console.log(jwtSecret);

async function login(req, res) {
  try {
    console.log(req.body);
    const { username, password } = req.body;
    const foundUser = await User.findOne({ username });

    if (foundUser) {
      const passOk = bcrypt.compareSync(password, foundUser.password);
      if (passOk) {
        jwt.sign(
          { userId: foundUser._id, username },
          jwtSecret,
          {},
          (err, token) => {
            if (err) throw err;
            res
              .cookie("token", token, { sameSite: "none", secure: true })
              .json({
                id: foundUser._id,
              });
          }
        );
      }
    } else {
      res.status(401).json("Invalid credentials");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error during login");
  }
}

async function logout(req, res) {
  res
    .cookie("token", "", { sameSite: "none", secure: true })
    .json("Logout successful");
}

async function register(req, res) {
  try {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({
      username: username,
      password: hashedPassword,
    });

    jwt.sign(
      { userId: createdUser._id, username },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;
        res
          .cookie("token", token, { sameSite: "none", secure: true })
          .status(201)
          .json({
            id: createdUser._id,
          });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json("Error during registration");
  }
}

module.exports = {
  login,  
  logout,
  register,
};
