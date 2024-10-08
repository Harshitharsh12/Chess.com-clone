const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w";
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game ♟️♟️♟️" });
});
io.on("connection", (uniqueSocket) => {
  uniqueSocket.emit("con", "You are now Connected!!");
  console.log(`${uniqueSocket.id} id user connected`);
  if (!players.white) {
    players.white = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "b");
  } else {
    uniqueSocket.emit("spectatorRole");
  }
  uniqueSocket.on("disconnect", () => {
    if (uniqueSocket.id === players.white) {
      delete players.white;
    } else if (uniqueSocket.id === players.black) {
      delete players.black;
    }
    console.log(`${uniqueSocket.id} id user disconnected`);
  });
  uniqueSocket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && uniqueSocket.id !== players.white) {
        uniqueSocket.emit("invalid", "This is not your turn");
        return;
      }
      if (chess.turn() === "b" && uniqueSocket.id !== players.black) {
        uniqueSocket.emit("invalid", "This is not your turn");
        return;
      }
      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid move: " + move);
      }
    } catch (err) {
      console.log(err);
      uniqueSocket.emit("InvalidMove", " You are playing an Invalid Move");
    }
  });
});

server.listen(3000, () => {
  console.log("listining on port 3000");
});
