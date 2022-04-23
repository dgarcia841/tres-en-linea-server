import { GameServer } from ".";
import GameBoard from "../../model/GameBoard";
import Player from "./Player";

/**
 * Control de un juego
 */
export default class Game {
    public readonly players: [Player, Player];
    public readonly id: string;
    private board: GameBoard;
    constructor(...players: [Player, Player]) {
        this.players = players;
        this.id = Date.now().toString(36);
        this.board = new GameBoard();
        players.forEach(player => {
            const other = this.other(player);
            if(!other) return;
            player.socket.emit("onGameStarted", this.id, other.username, this.isTurnOf(player));
        });
    }
    /**
     * Hace una jugada en el juego
     * @param player Jugador que hace la jugada
     * @param x fila de la jugada
     * @param y columna de la jugada
     * @returns Si se pudo hacer la jugada o no
     */
    public play(player: Player, x: number, y: number): boolean {
        const index = this.players.indexOf(player);
        if (index < 0) return false;
        return this.board.play(index, x, y);
    }
    /**
     * Comprueba si es el turno de un jugador o no
     * @param playerOrUsername El jugador o nombre de jugador a comprobar
     * @returns Si es el turno del jugador solicitado o no
     */
    public isTurnOf(playerOrUsername: Player | string | undefined): boolean {
        const player = this.get(playerOrUsername);
        if (!player) return false;
        const index = this.players.indexOf(player);
        return index == this.board.turn;
    }

    /**
     * Obtiene un jugador registrado en el juego
     * @param playerOrUsername Jugador, o nombre del jugador
     * @returns Jugador obtenido
     */
    public get(playerOrUsername: Player | string | undefined) {
        let player: Player | undefined;
        if (typeof (playerOrUsername) == "string") {
            player = this.players.find(x => x.username == playerOrUsername);
        }
        else {
            player = playerOrUsername;
        }
        return player;
    }
    /**
     * Comprueba si el juego incluye a un jugador específico o no
     * @param playerOrUsername Jugador o nombre de usuario del jugador
     * @returns Si el juego incluye al jugador o no
     */
    public includes(playerOrUsername: Player | string | undefined) {
        return !!this.get(playerOrUsername);
    }
    /**
     * Obtiene el otro jugador del juego. Es decir, si en el juego están jugando A y B,
     * ingresar como parámetro A devolverá B.
     * @param playerOrUsername El jugador A
     * @returns El jugador B
     */
    public other(playerOrUsername: Player | string | undefined): Player | undefined {
        const player = this.get(playerOrUsername);
        if (!player) return undefined;
        return this.players.find(x => x !== playerOrUsername);
    }

    /**
     * Finaliza una partida
     * @param winnerPlayerOrUsername El jugador o nombre del jugador que ganó
     */
    public end(winnerPlayerOrUsername: Player | string | undefined) {
        const winner = this.get(winnerPlayerOrUsername);
        const winnerName = winner ? winner.username : "-";
        this.players.forEach(player => {
            const result: GameServer.IGameResult = winnerName == "-" ? "draw" : (
                winnerName == player.username ? "victory": "defeat"
            );
            player.socket.emit("onGameEnded", this.id, winnerName, result);
        });
    }
}