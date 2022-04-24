type ICell = undefined | 0 | 1;
/**
 * Partida de tres en línea
 */
export default class GameBoard {
    private _turn: 0 | 1;
    private board: [
        [ICell, ICell, ICell],
        [ICell, ICell, ICell],
        [ICell, ICell, ICell],
    ];
    constructor() {
        this._turn = (<[0, 1]>[0, 1])[Math.round(Math.random())];
        this.board = [
            [undefined, undefined, undefined],
            [undefined, undefined, undefined],
            [undefined, undefined, undefined]
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
        if (value !== undefined) return false;

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

    /**
     * Comprueba si el tablero está lleno
     * @returns true si el tablero está lleno
     */
    public checkDraw(): boolean {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[i][j] === undefined) return false;
            }
        }
        return true;
    }

    /**
     * Comprueba si hay un ganador
     * @returns true si hay un ganador
     */
    public checkWinner(): [winner: (0 | 1), where: "column" | "row" | "diagonal", position: number] | undefined {
        const board = this.board;
        /**
         * obtiene el valor de una casilla
         * @param x fila
         * @param y columna
         * @returns valor de la casilla
         */
        const check = (x: number, y: number) => {
            return board[x][y];
        }
        /**
         * comprueba si hay un ganador en una fila
         * @param x fila
         * @returns true si hay un ganador en la fila 
         */
        const checkRow = (x: number) => {
            if (check(x, 0) == check(x, 1) && check(x, 1) == check(x, 2)) {
                return check(x, 0);
            }
            return undefined;
        }
        /**
         * comprueba si hay un ganador en una columna
         * @param y columna
         * @returns true si hay un ganador en la columna
         */
        const checkCol = (y: number) => {
            if (check(0, y) == check(1, y) && check(1, y) == check(2, y)) {
                return check(0, y);
            }
            return undefined;
        }
        /**
         * comprueba si hay un ganador en una diagonal
         * @returns true si hay un ganador en la diagonal
         */
        const checkDiag = () => {
            if (check(0, 0) == check(1, 1) && check(1, 1) == check(2, 2)) {
                return check(0, 0);
            }
            return undefined;
        }
        /**
         * comprueba si hay un ganador en una diagonal
         * @returns true si hay un ganador en la diagonal
         */
        const checkDiag2 = () => {
            if (check(0, 2) == check(1, 1) && check(1, 1) == check(2, 0)) {
                return check(0, 2);
            }
            return undefined;
        }
        // comprueba si hay un ganador en alguna fila, columna o diagonal
        const checkDiagWinner = checkDiag();
        if (checkDiagWinner !== undefined) return [checkDiagWinner, "diagonal", 0];
        const checkDiag2Winner = checkDiag2();
        if (checkDiag2Winner !== undefined) return [checkDiag2Winner, "diagonal", 1];
        for (let i = 0; i < 3; i++) {
            const rowWinner = checkRow(i);
            if (rowWinner !== undefined) return [rowWinner, "column", i];
            const colWinner = checkCol(i);
            if (colWinner !== undefined) return [colWinner, "row", i];
        }

        return undefined;
    }

    /**
     * Reiniciar el tablero
     */
    public restart() {
        this._turn = (<[0, 1]>[0, 1])[Math.round(Math.random())];
        this.board = [
            [undefined, undefined, undefined],
            [undefined, undefined, undefined],
            [undefined, undefined, undefined]
        ];
    }
}
