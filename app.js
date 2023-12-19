const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const ws = require("ws");
const { handleConnection } = require("./controllers/socketController");
const routes = require("./routes");

dotenv.config();

// Use native promises (use the global Promise object)
mongoose.Promise = global.Promise;

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    startServer();
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use("/uploads", express.static(__dirname + "/uploads"));
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    cors({
      credentials: true,
      origin: process.env.CLIENT_URL,
    })
  );

  app.use("/", routes);

  app.get("/", (req, res) => {
    res.send("<h1>Backend for Chat App</h1>");
  });

  const wss = new ws.Server({ server });

  wss.on("connection", (connection, req) => {
    handleConnection(connection, req, wss);
  });

  const PORT = process.env.PORT || 4040;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
