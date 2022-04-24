import { GameServer } from ".";
import GameBoard from "../../model/GameBoard";
import LeaderBoard from "../../model/LeaderBoard";
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
        players.forEach((player, i) => {
            const other = this.other(player);
            if (!other) return;
            player.socket.emit("onGameStarted", this.id, other.username, this.isTurnOf(player), i);
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
        if (!this.board.play(index, x, y)) {
            return false;
        }
        // enviar el movimiento al resto de jugadores
        const other = this.other(player);
        if (other) {
            other.socket.emit("onRivalPlay", this.id, x, y);
        }


        // datos del ganador
        const winnerData = this.checkWinner();
        // comprobar si hay un ganador
        if (winnerData) {
            console.log("Player " + winnerData[0].username + " won in game " + this.id);

            // obtener datos del ganador
            const [winner, where, position] = [winnerData[0].username, winnerData[1], winnerData[2]];

            // emitir mensaje a los jugadores
            this.players.forEach(player => {
                // obtener resultado del juego
                const result: GameServer.IGameResult = winner == player.username ? "victory" : "defeat";
                // emitir resultado del juego
                player.socket.emit("onWin", this.id, winner, result, where, position);
            });

            // darle 100 puntos en el leaderboard al jugador que ganó
            LeaderBoard.add(winner, 100);


            // Reiniciar partida
            this.resetDelayed();
        }
        // comprobar si hay un empate
        else if (this.checkDraw()) {
            console.log("Game " + this.id + " ended in draw");
            // emitir a ambos jugadores
            this.players.forEach(player => {
                player.socket.emit("onDraw", this.id);
            });

            // darle 10 puntos a ambos jugadores en el leaderboard
            this.players.forEach(player => {
                LeaderBoard.add(player.username, 10);
            });

            // reiniciar partida
            this.resetDelayed();
        }

        return true;
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
                winnerName == player.username ? "victory" : "defeat"
            );
            player.socket.emit("onGameEnded", this.id, winnerName, result);
        });
    }

    /**
     * Obtiene el ganador del juego, si lo hay
     * @returns El jugador ganador, o undefined si no hay ganador
     */
    public checkWinner(): [winner: Player, where: "column" | "row" | "diagonal", position: number] | undefined {
        const winner = this.board.checkWinner();
        if (winner == undefined) return undefined;
        return [this.players[winner[0]], winner[1], winner[2]];
    }
    /**
     * Comprueba si hay un empate
     * @returns Si hay un empate o no
     */
    public checkDraw(): boolean {
        return this.board.checkDraw();
    }

    /**
     * Reiniciar el juego
     */
    public restart() {
        this.board.restart();
    }

    /**
     * Reinicia el juego tras cierto tiempo
     * @param delay Tiempo de espera
     */
    public resetDelayed(delay = 2000) {
        setTimeout(() => {
            // reiniciar el juego
            this.restart();
            // emitir a los jugadores
            this.players.forEach(player => {
                player.socket.emit("onGameRestarted", this.isTurnOf(player));
            });

            // emitir el puntaje de ambos jugadores a cada jugador
            this.players.forEach(player => {
                const other = this.other(player);
                if (!other) return;
                player.socket.emit("onScore", LeaderBoard.getScore(player.username), LeaderBoard.getScore(other.username));
            });
        }, delay);
    }

}