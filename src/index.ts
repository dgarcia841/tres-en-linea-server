import express from "express";
import fs from "fs";
import GameServer from "./control/GameServer";
const app = express();

app.get("/", (_, res) => {
    res.end(fs.readFileSync(__dirname + "/test2.png"));
});

app.listen(3000, () => {
    console.log("Listening on port 3000");
});

new GameServer(4500);
console.log("owo2");