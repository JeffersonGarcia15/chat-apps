import express from "express";
import logger from "morgan";

const port = process.env.PORT || 3001;

const app = express();

app.use(logger("dev"));

app.use(express.json());

const messages = [];

app.get("/", (req, res) => {
    res.sendFile(process.cwd() + "/client/index.html");
});

app.get("/messages", (req, res) => {
    res.json(messages);
});

app.post("/messages", (req, res) => {
    const { message } = req.body;
    messages.push({
        id: messages.length + 1,
        message,
    });
    res.status(201).json(message);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});