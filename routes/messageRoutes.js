const express = require("express");
const messageController = require("../controllers/messageController");

const router = express.Router();

router.get("/messages/:userId", messageController.getMessages);
router.get("/people", messageController.getPeople);
router.get("/profile", messageController.getProfile);

module.exports = router;
