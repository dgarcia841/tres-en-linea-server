import express from "express"
import LeaderBoard from "../../model/LeaderBoard";

const app = express();

/**
 * get method for /leaderboard
 */
app.get("/leaderboard", (_, res) => {
    res.send(JSON.stringify(LeaderBoard.getTopTen()));
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});