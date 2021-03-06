import IO from "socket.io";
import LeaderBoard from "../../model/LeaderBoard";
import AiClient from "../AiClient";
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

    public readonly suscribed: GameServer.ISocket[];

    public constructor(port = 9000) {
	console.log("Game server running on port: " + port);
        this.server = new IO.Server(port, {
            cors: {
                origin: "*"
            }
        });
        this.players = [];
        this.queue = [];
        this.games = [];
        this.suscribed = [];

        this.server.on("connect", socket => {
            console.log("Client connected: " + socket.id);
            // Iniciar emparejamiento
            socket.on("startGame", (...args) => this.onStartGame(socket, ...args));
            // El jugador hace una jugada en un juego existente
            socket.on("playGame", (...args) => this.onPlayGame(socket, ...args));
            // Cancelar partidas y emparejamientos
            socket.on("disconnect", () => this.onDisconnect(socket));
            // el jugador se suscribe al leaderboard
            socket.on("subscribeToLeaderboard", () => {
                this.suscribed.push(socket);
            });
        });

        // emitir leaderboard a los suscriptores cada 2s
        setInterval(() => {
            this.suscribed.forEach(socket => {
                // mapear nombres de usuario y puntajes en el top 10 usando URL encoded
                const leaderboard = LeaderBoard.getTopTen()
                    .map(x => encodeURIComponent(x.username) + "=" + x.score)
                    .join("/");
                // emitir leaderboard
                socket.emit("onLeaderboard", leaderboard);
            });
        }, 2000);
            
    }

    /**
     * Evento que se ejecuta al solicitar el inicio de un juego
     * @param socket El socket que solicita el inicio del juego
     * @param params [El nombre de usuario]
     */
    private onStartGame(socket: GameServer.ISocket, ...params: Parameters<GameServer.IClientToServer["startGame"]>) {
        let username = params[0];
        username = NameManager.cleanName(username);

        const gamemode = params[1] == 1 ? "ia" : "pvp";
        const rivalid = params[2];
        const wantedRival = this.players.find(x => x.socket.id == rivalid);

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

        if (gamemode == "ia") {
            AiClient(player, this.games);
        }
        // si el jugador solicita jugar contra un rival
        else if (wantedRival) {
            const game = new Game(player, wantedRival);
            this.games.push(game);
            console.log("Game started: " + game.id);
        }
        // Si hay otro jugador en cola
        else if (this.queue.length >= 1) {
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
        }
        else {
            // abortar proceso y emitir mensaje de error
            player.socket.emit("onError", ...GetError("GAME_PLAY_ERROR"));
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
        // desuscribir al jugador del leaderboard
        const index = this.suscribed.indexOf(socket);
        if (index >= 0) this.suscribed.splice(index, 1);
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
         * @param mode El modo de juego (0 para partida rápida, 1 para juego contra la IA)
         * @param rivalid El identificador del rival, o '' si se desea una partida rápida
         */
        (username: string, mode: number, rivalid: string) => void;
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

        /** 
         * Suscribirse a actualizaciones periódicas del leaderboard
        */
        subscribeToLeaderboard:
        () => void;
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
         * Enviar mensaje al cliente cuando la partida se haya reiniciado
         * @param yourturn Es el turno del jugador actual?
         */
        onGameRestarted:
        (yourturn: boolean) => void;
        
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
         * Enviar mensaje al cliente cuando alguien gane la partida
         */
        onWin:
        /**
         * @param gameid ID de la partida creada
         * @param winner El jugador ganador de la ronda
         * @param result El resultado de la partida
         * @param where El lugar en el que ganó
         * @param position La posición en la que ganó
         */
        (gameid: string, winner: string, result: IGameResult, where: IGamePosition, position: number) => void;

        /**
         * Enviar mensaje al cliente cuando la partida termine en empate
         */
        onDraw:
        /**
         * @param gameid ID de la partida creada
        */
        (gameid: string) => void;

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


        /**
         * Enviar mensaje al cliente con el puntaje de su jugador
         */
        onScore:
        /**
         * @param score El puntaje del jugador
         * @param rivalscore El puntaje del rival
        */
        (score: number, rivalscore: number) => void;

        /**
         * Enviar mensaje al cliente con el leaderboard, separados por coma
         */
        onLeaderboard:
        (leaderboard: string) => void;
    }
    export type IGameResult = "victory" | "defeat" | "draw";
    export type IGamePosition = "row" | "column" | "diagonal";
}
