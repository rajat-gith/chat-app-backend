const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const User = require("../models/User");

const jwtSecret = process.env.JWT_SECRET;

async function getMessages(req, res) {
  try {
    const { userId } = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await Message.find({
      sender: { $in: [userId, ourUserId] },
      recipient: { $in: [userId, ourUserId] },
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error getting messages");
  }
}

async function getPeople(req, res) {
  try {
    const users = await User.find({}, { _id: 1, username: 1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error getting people");
  }
}

async function getProfile(req, res) {
  try {
    const userData = await getUserDataFromRequest(req);
    res.json(userData);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error getting profile");
  }
}

module.exports = {
  getMessages,
  getPeople,
  getProfile,
};
