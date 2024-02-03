import express from "express";
import logger from "morgan";

const port = process.env.PORT || 3002;

const app = express();

app.use(logger("dev"));

app.use(express.json());

const messages = [];

// long-polling -> this will hold the requests that are waiting for a message
const requests = [];

app.get("/", (req, res) => {
    res.sendFile(process.cwd() + "/client/index.html");
});

app.get("/messages", (req, res) => {
    const lastMessageId = Number(req.query.lastMessageId) || 0;
    const newMessages = messages.filter((message) => message.id > lastMessageId);

    if (newMessages.length) {
        res.json(newMessages);
    } else {
        requests.push({ lastMessageId, res });
    }
});

app.post("/messages", (req, res) => {
    const { message } = req.body;
    const newMessage = {
        id: messages.length + 1,
        message,
    };
    messages.push(newMessage);

    // Send the new message to all the clients that are waiting for a message
    while (requests.length > 0) {
        const request = requests.shift();
        if (request.lastMessageId < newMessage.id) {
            request.res.json(messages.filter((message) => message.id > request.lastMessageId));
        }
    }

    res.status(201).json(newMessage);
});

// Handle long polling timeout
setInterval(() => {
    while (requests.length > 0) {
        const request = requests.shift();
        request.res.json([]);
    }
}, 30000);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});