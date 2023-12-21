const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const ws = require("ws");
const Message = require("../models/Message");
const User = require("../models/User");
dotenv.config();


const jwtSecret = process.env.JWT_SECRET;

async function handleConnection(connection, req, wss) {
  try {
    function notifyAboutOnlinePeople() {
      [...wss.clients].forEach((client) => {
        client.send(
          JSON.stringify({
            online: [...wss.clients].map((c) => ({
              userId: c.userId,
              username: c.username,
            })),
          })
        );
      });
    }

    connection.isAlive = true;

    connection.timer = setInterval(() => {
      connection.ping();
      connection.deathTimer = setTimeout(() => {
        connection.isAlive = false;
        clearInterval(connection.timer);
        connection.terminate();
        notifyAboutOnlinePeople();
        console.log("dead");
      }, 1000);
    }, 5000);

    connection.on("pong", () => {
      clearTimeout(connection.deathTimer);
    });

    // read username and id form the cookie for this connection
    const cookies = req.headers.cookie;
    if (cookies) {
      const tokenCookieString = cookies
        .split(";")
        .find((str) => str.startsWith("token="));
      if (tokenCookieString) {
        const token = tokenCookieString.split("=")[1];
        if (token) {
          jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if (err) throw err;
            const { userId, username } = userData;
            connection.userId = userId;
            connection.username = username;
          });
        }
      }
    }

    connection.on("message", async (message) => {
      try {
        const messageData = JSON.parse(message.toString());
        const { recipient, text, file } = messageData;
        let filename = null;
        if (file) {
          console.log("size", file.data.length);
          const parts = file.name.split(".");
          const ext = parts[parts.length - 1];
          filename = Date.now() + "." + ext;
          const path = __dirname + "/uploads/" + filename;
          const bufferData = new Buffer(file.data.split(",")[1], "base64");
          fs.writeFile(path, bufferData, () => {
            console.log("file saved:" + path);
          });
        }
        if (recipient && (text || file)) {
          const messageDoc = await Message.create({
            sender: connection.userId,
            recipient,
            text,
            file: file ? filename : null,
          });
          console.log("created message");
          [...wss.clients]
            .filter((c) => c.userId === recipient)
            .forEach((c) =>
              c.send(
                JSON.stringify({
                  text,
                  sender: connection.userId,
                  recipient,
                  file: file ? filename : null,
                  _id: messageDoc._id,
                })
              )
            );
        }
      } catch (err) {
        console.error(err);
      }
    });

    // notify everyone about online people (when someone connects)
    notifyAboutOnlinePeople();
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  handleConnection,
};
