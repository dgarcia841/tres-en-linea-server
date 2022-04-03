import express from "express";
import IO from "socket.io";
import fs from "fs";
const app = express();

app.get("/", (_, res) => {
    res.end(fs.readFileSync(__dirname + "/test2.png"));
});

app.listen(3000, () => {
    console.log("Listening on port 3000");
});
const io = new IO.Server(4500);
io.on("connection", socket => {
    console.log("client connected!!!!!!");
    setTimeout(() => {
        socket.emit("XD", "hola qn sos");
        console.log("preguntando x");
    }, 1500);
    
});
console.log("owo2");