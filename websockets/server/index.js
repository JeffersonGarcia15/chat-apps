import express from "express";
import logger from "morgan";

const port = process.env.PORT || 3000;

const app = express();
app.use(logger("dev")); // to show logs like this one GET / 304 2.765 ms - -

app.get("/", (req, res) => {
  res.send("<h1>Hello World!</h1>");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

