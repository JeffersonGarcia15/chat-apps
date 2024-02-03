import express from "express";
import logger from "morgan";
import dotenv from "dotenv";
import { createClient } from "@libsql/client";

import { Server } from "socket.io";
import { createServer } from "node:http";

const port = process.env.PORT || 3000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  connectionStateRecovery: {
    maxDisconnectionDuration: 5000,
  }
}); // create a new instance of socket.io. In/Out

dotenv.config(); // to use .env file

const db = createClient({
  url: process.env.DB_TOKEN,
  authToken: process.env.DB_AUTH_TOKEN,
});

await db.execute(
  `
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL
  )
  `
); // ideally we should be using UUIDs for the primary key

io.on("connection", async (socket) => {
  console.log("A user has connected");

  socket.on("message", async (message) => {
    console.log("message: ", message);
    let result;
    try {
      result = await db.execute({
        sql: "INSERT INTO messages (message) VALUES (:message)",
        args: { message }
      });
    } catch (error) {
      console.error("Error inserting message: ", error);
      return;
    } finally {
      io.emit("message", message, result.lastInsertRowid.toString());
      // await db.close();
    }

  });

  socket.on("disconnect", () => {
    console.log("A user has disconnected");
  });

  // Get the messages that you received when you were offline

  // Client should send auth: {token:... username:..., serverOffset:...} where serverOffset is the last message id received, default 0
  // socket.auth.serverOffset = serverOffset;(arg: serverOffset) on the frontend, this indicates the id of the last message that was received by the client
  if (!socket.recovered) {
    try {
      const results = await db.execute({
        sql: "SELECT * FROM messages WHERE id > ?",
        args: [socket.handshake.auth.serverOffset ?? 0]
      });

      // Send the messages to the client
      results.rows.forEach((row) => {
        socket.emit("message", row.message, row.id.toString()); // socket.on on the frontend will get these 2 arguments, message and id
      });
    } catch (error) {
      console.error("Error getting messages: ", error);
    }
  }


});
app.use(logger("dev")); // to show logs like this one GET / 304 2.765 ms - -

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/client/index.html");
});

httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

