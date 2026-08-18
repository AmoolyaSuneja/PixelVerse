import { WebSocketServer } from "ws";
import { User } from "./UserV2";
import express from "express";

process.on("uncaughtException", (err) => {
  console.error("CRITICAL CRASH ERROR:", err);
});

const app = express();
app.get("/", (_req, res) => {
  res.send("WebSocket Server is running (Health Check OK)");
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8081;
const server = app.listen(PORT, () => {
  console.log(`HTTP Health server running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });
wss.on("connection", function connection(ws) {
  console.log("user connected");
  let user = new User(ws);
  ws.on("error", console.error);

  ws.on("close", () => {
    user?.destroy();
  });
});
