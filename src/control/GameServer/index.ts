import IO from "socket.io";
import GetError from "../GetError";
import { NameManager } from "../Util/NameManager";
import Game from "./Game";
import Player from "./Player";

export default class GameServer {
    public readonly server: GameServer.IServer;

    public readonly playerQueue: Player[];
    public readonly games: Game[];

    public constructor(port = 9000) {
        this.server = new IO.Server(port);
        this.playerQueue = [];
        this.games = [];
        this.server.on("connect", socket => {
            console.log("Nuevo cliente conectado!");
            // Iniciar emparejamiento
            socket.on("startGame", (username) => {
                username = NameManager.cleanName(username);

                // Ya hay un usuario en emparejamiento con el mismo nombre
                if (!!this.playerQueue.find(p => p.username == username)) {
                    socket.emit("onError", ...GetError("USERNAME_EXISTING"));
                    return;
                }
                const player = new Player(username, socket);
                // Si hay otro jugador en cola
                if (this.playerQueue.length >= 1) {
                    // Sacarlo de la cola y usarlo como rival
                    const rival = this.playerQueue.shift();
                    if (rival) {
                        const game = new Game(player, rival);
                        this.games.push(game);
                        // Emparejamiento finalizado, partida iniciada
                        socket.emit("onGameStarted", game.id, rival.username);
                    }
                }
                // Si no hay jugadores en cola,
                else {
                    // Poner jugador en cola
                    this.playerQueue.push(player);
                }

            });
            // El jugador hace una jugada en un juego existente
            socket.on("playGame", (gameid, x, y) => {
                console.log(`jugada en ${gameid} hecha en ${x}, ${y}`);
                // Hacer movida del rival
                socket.emit("onRivalPlay", gameid, x + 1, y + 1);
                // Juego terminado
                socket.emit("onGameEnded", gameid, "the machine", "defeat");
            });
        });
    }
}

export namespace GameServer {
    export type IServer = IO.Server<GameServer.IClientToServer, GameServer.IServerToClient>;
    export type ISocket = IO.Socket<GameServer.IClientToServer, GameServer.IServerToClient>;
    export interface IClientToServer {
        /**
         * Iniciar el emparejamiento para una partida rápida
         */
        startGame:
        /**
         * @param username El nombre de usuario del jugador
         */
        (username: string) => void;
        /**
         * Hacer jugada en una partida existente
         */
        playGame:
        /**
         * @param gameid El ID de la partida
         * @param x La celda x en la cual hacer la jugada
         * @param y La celda y en la cual hacer la jugada
         */
        (gameid: string, x: number, y: number) => void;
    }
    export interface IServerToClient {
        /**
         * Enviar mensaje al cliente cuando la partida inicie
         */
        onGameStarted:
        /**
         * @param gameid ID de la partida creada
         * @param rivalname nombre del rival en la partida
         */
        (gameid: string, rivalname: string) => void;
        /**
         * Enviar mensaje al cliente cuando el rival haga una jugada
         */
        onRivalPlay:
        /**
         * @param gameid ID de la partida creada
         * @param x La celda x en la cual se hizo la jugada
         * @param y La celda y en la cual se hizo la jugada
         */
        (gameid: string, x: number, y: number) => void;
        /**
         * Enviar mensaje al cliente cuando la partida finaliza
         */
        onGameEnded:
        /**
         * @param gameid El ID de la partida finalizada
         * @param winnername El nombre del jugador ganador
         * @param result El resultado de la partida
         */
        (gameid: string, winnername: string, result: IGameResult) => void;

        /**
         * Enviar mensaje de error al cliente
         */
        onError:
        /**
         * @param code El código de error
         * @param error La descripción del error;
         */
        (code: number, error: string) => void;
    }
    export type IGameResult = "victory" | "defeat" | "draw";
}