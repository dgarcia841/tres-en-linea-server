import IO from "socket.io";
import GetError from "../GetError";
import NameManager from "../Util/NameManager";
import Game from "./Game";
import Player from "./Player";

/**
 * Controlador de la conexión de juego
 */
export default class GameServer {
    public readonly server: GameServer.IServer;

    public readonly players: Player[];
    public readonly queue: Player[];
    public readonly games: Game[];

    public constructor(port = 9000) {
        this.server = new IO.Server(port, {
            cors: {
                origin: "*"
            }
        });
        this.players = [];
        this.queue = [];
        this.games = [];

        this.server.on("connect", socket => {
            console.log("Client connected: " + socket.id);
            // Iniciar emparejamiento
            socket.on("startGame", (username) => this.onStartGame(socket, username));
            // El jugador hace una jugada en un juego existente
            socket.on("playGame", (...args) => this.onPlayGame(socket, ...args));
            // Cancelar partidas y emparejamientos
            socket.on("disconnect", () => this.onDisconnect(socket));
        });
    }

    /**
     * Evento que se ejecuta al solicitar el inicio de un juego
     * @param socket El socket que solicita el inicio del juego
     * @param params [El nombre de usuario]
     */
    private onStartGame(socket: GameServer.ISocket, ...params: Parameters<GameServer.IClientToServer["startGame"]>) {
        let username = params[0];
        username = NameManager.cleanName(username);

        // Ya hay un usuario en cola con el mismo nombre
        if (!!this.queue.find(p => p.username == username)) {
            // abortar proceso y emitir mensaje de error
            socket.emit("onError", ...GetError("USERNAME_EXISTING"));
            return;
        }
    
        // Crear el jugador y guardarlo en la lista
        const player = new Player(username, socket);
        this.players.push(player);

        console.log("Player added to the queue: " + player.username + " (" + player.socket.id + ")");

        // Si hay otro jugador en cola
        if (this.queue.length >= 1) {
            // Sacarlo de la cola y usarlo como rival
            const rival = this.queue.shift();
            if (rival && rival !== player && rival.username !== player.username) {
                const game = new Game(player, rival);
                this.games.push(game);
                console.log("Game started: " + game.id);
            }
        }
        // Si no hay jugadores en cola,
        else {
            // Poner jugador en cola
            this.queue.push(player);
        }
    }

    private onPlayGame(socket: GameServer.ISocket, ...params: Parameters<GameServer.IClientToServer["playGame"]>) {
        const [gameid, username, x, y] = params;
        const game = this.games.find(x => x.id == gameid);

        console.log("Player " + username + " (" + socket.id + ") played in game " + gameid + " at (" + x + ", " + y + ")");

        // si no se encontró la partida,
        if (!game) {
            console.warn("Game not found: " + gameid);
            // abortar proceso y emitir mensaje de error
            socket.emit("onError", ...GetError("GAME_NOT_FOUND"));
            return;
        }
        const player = game.get(username);
        if (!player) {
            console.warn("Player not found: " + username);
            // abortar proceso y emitir mensaje de error
            socket.emit("onError", ...GetError("PLAYER_NOT_FOUND"));
            return;
        }
        // Si se pudo hacer la jugada
        if (game.play(player, x, y)) {
            console.log("Game " + gameid + " played");
            const other = game.other(player);
            if (other) {
                other.socket.emit("onRivalPlay", game.id, x, y);
            }
        }
        else {
            // abortar proceso y emitir mensaje de error
            socket.emit("onError", ...GetError("GAME_PLAY_ERROR"));
            return;
        }

    }

    /**
     * Evento que se ejecuta al desconectarse un cliente
     * @param socket El socket que se desconecta
     */
    private onDisconnect(socket: GameServer.ISocket) {
        const player = this.players.find(x => x.socket.id == socket.id);
        if (player) {
            console.log("Player " + player.username + " (" + player.socket.id + ") disconnected");
            let index = this.queue.indexOf(player);
            if (index >= 0) {
                this.queue.splice(index, 1);
            }

            // Finalizar partida
            const game = this.games.find(x => x.includes(player));
            if (game) {
                game.end(game.other(player));
                const index = this.games.indexOf(game);
                if (index >= 0) this.games.splice(index, 1);
                console.log("Game " + game.id + " ended");
            }
        }
        else {
            console.log("Client disconnected: " + socket.id);
        }
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
        (gameid: string, username: string, x: number, y: number) => void;
    }
    export interface IServerToClient {
        /**
         * Enviar mensaje al cliente cuando la partida inicie
         */
        onGameStarted:
        /**
         * @param gameid ID de la partida creada
         * @param rivalname nombre del rival en la partida
         * @param yourturn Es el turno del jugador actual?
         * @param yourid ID del jugador actual
         */
        (gameid: string, rivalname: string, yourturn: boolean, yourid: number) => void;
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