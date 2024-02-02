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

io.on("connection", (socket) => {
  console.log("A user has connected");

  socket.on("message", async (message) => {
    console.log("message: ", message);
    let result;
    try {
      result = await db.execute({
        sql: "INSERT INTO messages (message) VALUES (:message)",
        args: { message}
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

});
app.use(logger("dev")); // to show logs like this one GET / 304 2.765 ms - -

app.get("/", (req, res) => {
  res.send("<h1>Hello World!</h1>");
});

httpServer.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

