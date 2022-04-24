/**
 * Partida de tres en línea
 */
export default class GameBoard {
    private _turn: 0 | 1;
    private board: [
        [-1|0|1, -1|0|1, -1|0|1],
        [-1|0|1, -1|0|1, -1|0|1],
        [-1|0|1, -1|0|1, -1|0|1]
    ];
    constructor() {
        this._turn = (<[0, 1]>[0, 1])[Math.round(Math.random())];
        this.board = [
            [-1, -1, -1],
            [-1, -1, -1],
            [-1, -1, -1]
        ];
    }
    public get turn(): 0 | 1 {
        return this._turn;
    }
    /**
     * Hacer una jugada
     * @param player Número del jugador (solo 0|1). Si no es el turno de ese jugador,
     * no se realizará la jugada. Si se proporciona una posición incorrecta en tablero,
     * no se realizará la jugada. Si la posición proporcionada ya está ocupada,
     * no se realizará la jugada.
     * @param x fila a hacer la jugada
     * @param y columna a hacer la jugada
     */
    public play(player: number, x: number, y: number): boolean {
        if (player !== 0 && player !== 1) return false;
        if(this.turn !== player) return false;
        x = Math.floor(x);
        y = Math.floor(y);
        if (x < 0 || x > 2) return false;
        if (y < 0 || y > 2) return false;

        const value = this.board[x][y];
        if (value !== -1) return false;

        this.board[x][y] = (<[0, 1]>[0, 1])[player];
        this._turn = (<[0, 1]>[0, 1])[1 - player];
        return true;
    }

    /**
     * Representación string del tablero de juego
     */
    public toString() {
        return this.board.map(row => row.join(",")).join("\n");
    }
}