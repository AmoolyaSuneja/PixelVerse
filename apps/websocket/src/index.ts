import { WebSocketServer } from "ws";
import { User } from "./UserV2";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8081;
const wss = new WebSocketServer({ port: PORT });

wss.on("connection", function connection(ws) {
  console.log("user connected");
  let user = new User(ws);
  ws.on("error", console.error);

  ws.on("close", () => {
    user?.destroy();
  });
});
