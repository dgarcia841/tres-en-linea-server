import SocketIO, { Socket } from "socket.io-client"
import { GameServer } from "../GameServer";
import Game from "../GameServer/Game";
import Player from "../GameServer/Player";
import { createAI } from "./IA";

/**
 * Conecta un cliente de IA a una partida
 * @param playerid El id del jugador al cual conectarse
 * @param allGames Un array con todos los juegos que se están jugando
 */
export default function AiClient(player: Player, allGames: Game[]) {
    let game: Game | undefined;
    const ai = createAI();
    const io: Socket<GameServer.IServerToClient, GameServer.IClientToServer> = SocketIO("http://localhost:4500");
    async function play() {
        if (!game) return;
        const other = game.other(player);
        if (!other) return;
        const board = game.toArray();
        try {
            const { x, y } = await ai.play(board);
            io.emit("playGame", game.id, other.username, x, y);
        }
        catch (e) {
            console.log(`Machine ${io.id} says: ${e}`);
        }
    }

    io.connect();
    io.on("connect", () => {
        const name = `The machine`;
        io.emit("startGame", name, 0, player.socket.id);
    });
    io.on("onGameStarted", (gameid, _, yourturn) => {
        game = allGames.find(g => g.id === gameid);
        if(yourturn) play();
    });
    io.on("onGameRestarted", yourturn => {
        if(yourturn) play();
    })
    io.on("onRivalPlay", () => {
        play();
    });
    io.on("onError", (code, msg) => {
        console.log(`Machine ${io.id} says: ${code} - ${msg}`);
    });
    io.on("onGameEnded", () => io.disconnect());
}