import { WebSocket } from "ws";
import { RoomManager } from "./RoomManager";
import client from "@repo/db/src/index";
import jwt, { JwtPayload } from "jsonwebtoken";
import sanitizedConfig from "./utils/config";

type OutgoingMessage = any;

function getRandomString(length: number) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

const bannedWords = [
  "fuck",
  "fucker",
  "fucking",
  "motherfucker",
  "shit",
  "ass",
  "asshole",
  "bitch",
  "cock",
  "cocksucker",
  "dick",
  "dildo",
  "pussy",
  "whore",
  "slut",
  "blowjob",
  "jerkoff",
  "crap",
  "poop",
  "piss",
  "pee",
  "butt",
  "fart",
  "turd",
  "shat",
  "idiot",
  "moron",
  "retard",
  "douche",
  "scum",
  "trash",
  "loser",
  "bastard",
  "wanker",
  "twat",
  "spastic",
  "nob",
  "git",
  "slag",
  "cunt",
  "nigger",
  "nigga",
  "k*ke",
  "sp*c",
  "ch*nk",
  "g*psy",
  "m*ng",
  "n****r",
  "n*gga",
  "fag",
  "faggot",
  "dyke",
  "queer",
  "tranny",
  "shemale",
  "hoe",
  "damn",
  "godamn",
  "jesuschrist",
  "bloody",
  "kill",
  "murder",
  "stab",
  "die",
  "suicide",
  "rapist",
  "wtf",
  "stfu",
  "ffs",
  "omfg",
  "pos",
  "sob",
  "@ss",
  "b!tch",
  "f*ck",
  "d!ck",
  "5hit",
  "a$$",
  "incest",
  "pedo",
  "nazi",
  "terrorist",
  "scumbag",
  "meth",
  "cocaine",
  "porn",
  "prostitute",
];

export class User {
  public id: string;
  public userId?: string;

  private spaceId?: string;
  private x: number;
  private y: number;
  private ws: WebSocket;
  private violationCount: number = 0;

  constructor(ws: WebSocket) {
    this.id = getRandomString(10);
    this.x = 0;
    this.y = 0;
    this.ws = ws;

    this.initHandlers();
  }

  initHandlers() {
    this.ws.on("message", async (data) => {
      try {
        const parsedData = JSON.parse(data.toString());

        switch (parsedData.type) {
          case "join": {
            const spaceId = parsedData.payload.spaceId;
            const token = parsedData.payload.token;

            const userId = (
              jwt.verify(token, sanitizedConfig.JWT_SECRET) as JwtPayload
            ).username;

            if (!userId) {
              this.ws.close();
              return;
            }

            this.userId = userId;

            const space = await client.space.findFirst({
              where: { id: spaceId },
            });

            if (!space) {
              this.ws.close();
              return;
            }

            if (space.bannedUsers.includes(userId)) {
              this.send({
                type: "join-rejected",
                payload: {
                  reason: "You are banned from this space.",
                },
              });

              this.ws.close();
              return;
            }

            this.spaceId = spaceId;

            const roomManager = RoomManager.getInstance();

            // Get existing users BEFORE adding this user.
            const existingUsers = roomManager.rooms.get(spaceId)?.length || 0;

            // Set spawn position.
            this.x = 5 + existingUsers;
            this.y = 5 + existingUsers;

            // Add user to room.
            roomManager.addUser(spaceId, this);

            const roomCalls =
              roomManager.ongoingCalls.get(spaceId) || new Map();

            // Send initial room state to this user.
            this.send({
              type: "space-joined",
              payload: {
                id: this.id,
                userId: this.userId,
                spawn: {
                  x: this.x,
                  y: this.y,
                },
                users:
                  roomManager.rooms
                    .get(spaceId)
                    ?.filter((x) => x.id !== this.id)
                    ?.map((u) => ({
                      id: u.id,
                      userId: u.userId,
                      x: u.x,
                      y: u.y,
                    })) ?? [],
                ongoingCalls: Array.from(roomCalls.entries()),
              },
            });

            // Notify everyone else that this user joined.
            roomManager.broadcast(
              {
                type: "user-joined",
                payload: {
                  id: this.id,
                  userId: this.userId,
                  x: this.x,
                  y: this.y,
                },
              },
              this,
              this.spaceId!,
            );

            break;
          }

          case "chat-message": {
            const message = parsedData.payload.message;

            if (parsedData.payload.isGlobal) {
              const containsProfanity =
                message &&
                bannedWords.some((word) =>
                  message.toLowerCase().includes(word.toLowerCase()),
                );

              try {
                await client.chatMessage.create({
                  data: {
                    spaceId: this.spaceId!,
                    userId: this.userId!,
                    message: message,
                  },
                });
              } catch (dbError) {
                console.error("Failed to save chat message to DB:", dbError);

                // We still broadcast the message even if DB saving fails.
              }

              if (containsProfanity) {
                this.violationCount++;

                if (this.violationCount >= 3) {
                  this.kick();
                } else {
                  this.send({
                    type: "chat-warning",
                    payload: {
                      message: `Warning: Inappropriate content detected. Violation ${this.violationCount}/3`,
                    },
                  });
                }

                return;
              }

              RoomManager.getInstance().broadcastToAll(
                {
                  type: "chat-message",
                  payload: {
                    userId: this.userId!,
                    message: message,
                    isGlobal: true,
                  },
                },
                this.spaceId!,
              );
            } else {
              const recipientId = parsedData.payload.recipient;

              const recipient = RoomManager.getInstance()
                .rooms.get(this.spaceId!)
                ?.find((u) => u.userId === recipientId);

              if (recipient) {
                recipient.send({
                  type: "chat-message",
                  payload: {
                    userId: this.userId!,
                    message: message,
                    isGlobal: false,
                  },
                });
              }
            }

            break;
          }

          case "move": {
            const moveX = parseFloat(parsedData.payload.x);
            const moveY = parseFloat(parsedData.payload.y);

            const distance = Math.sqrt(
              Math.pow(this.x - moveX, 2) + Math.pow(this.y - moveY, 2),
            );

            // Allow up to 1.5 units of movement per network tick.
            if (distance <= 1.5) {
              this.x = moveX;
              this.y = moveY;

              // Send movement confirmation to this user.
              this.send({
                type: "movement",
                payload: {
                  id: this.id,
                  userId: this.userId,
                  x: this.x,
                  y: this.y,
                },
              });

              // Broadcast movement to everyone else.
              RoomManager.getInstance().broadcast(
                {
                  type: "movement",
                  payload: {
                    id: this.id,
                    userId: this.userId,
                    x: this.x,
                    y: this.y,
                  },
                },
                this,
                this.spaceId!,
              );

              break;
            }

            this.send({
              type: "movement-rejected",
              payload: {
                x: this.x,
                y: this.y,
              },
            });

            break;
          }

          case "call-started": {
            const p1 = parsedData.payload.user1;
            const p2 = parsedData.payload.user2;

            RoomManager.getInstance().startCall(this.spaceId!, p1, p2);

            break;
          }

          case "call-ended": {
            const u1 = parsedData.payload.user1;
            const u2 = parsedData.payload.user2;

            RoomManager.getInstance().endCall(this.spaceId!, u1, u2);

            break;
          }

          case "webrtc-offer":
          case "webrtc-answer":
          case "webrtc-ice-candidate":
          case "webrtc-decline": {
            const recipientId = parsedData.payload.recipient;

            const recipient = RoomManager.getInstance()
              .rooms.get(this.spaceId!)
              ?.find((u) => u.userId === recipientId);

            if (recipient) {
              recipient.send({
                type: parsedData.type,
                payload: {
                  ...parsedData.payload,
                  sender: this.userId!,
                },
              });
            }

            break;
          }
        }
      } catch (err) {
        console.error("Error processing websocket message:", err);
      }
    });

    // Handle WebSocket errors.
    this.ws.on("error", (error) => {
      console.error(
        `WebSocket error for user ${this.userId ?? this.id}:`,
        error,
      );
    });

    // Handle disconnect.
    this.ws.on("close", () => {
      this.destroy();
    });
  }

  public async kick() {
    this.send({
      type: "kicked",
      payload: {
        reason: "Repeated inappropriate chat messages.",
      },
    });

    RoomManager.getInstance().broadcast(
      {
        type: "user-kicked",
        payload: {
          userId: this.userId,
          reason: "Repeated inappropriate chat messages.",
        },
      },
      this,
      this.spaceId!,
    );

    await client.space.update({
      where: { id: this.spaceId! },
      data: {
        bannedUsers: {
          push: this.userId!,
        },
      },
    });

    RoomManager.getInstance().removeUser(this, this.spaceId!);

    this.ws.close();
  }

  destroy() {
    // Prevent cleanup from running multiple times.
    if (!this.spaceId) {
      return;
    }

    const roomCalls = RoomManager.getInstance().ongoingCalls.get(this.spaceId);

    if (roomCalls && roomCalls.has(this.userId!)) {
      const otherUserId = roomCalls.get(this.userId!)!;

      const otherUser = RoomManager.getInstance()
        .rooms.get(this.spaceId)
        ?.find((u) => u.userId === otherUserId);

      if (otherUser) {
        otherUser.send({
          type: "call-end",
          payload: {
            from: this.userId!,
          },
        });
      }

      RoomManager.getInstance().endCall(
        this.spaceId,
        this.userId!,
        otherUserId,
      );
    }

    RoomManager.getInstance().broadcast(
      {
        type: "user-left",
        payload: {
          id: this.id,
          userId: this.userId,
        },
      },
      this,
      this.spaceId,
    );

    RoomManager.getInstance().removeUser(this, this.spaceId);

    // Prevent destroy() from executing its cleanup again.
    this.spaceId = undefined;
  }

  send(payload: OutgoingMessage) {
    // IMPORTANT:
    // Never call send() while the WebSocket is CONNECTING,
    // CLOSING, or CLOSED.
    if (this.ws.readyState !== WebSocket.OPEN) {
      console.warn(
        `Skipping WebSocket send for user ${
          this.userId ?? this.id
        }. ReadyState: ${this.ws.readyState}`,
      );

      return false;
    }

    try {
      this.ws.send(JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error(
        `Failed to send WebSocket message to user ${this.userId ?? this.id}:`,
        error,
      );

      return false;
    }
  }
}
