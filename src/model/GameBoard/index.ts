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
            const value = check(x, 0);
            if (value === undefined) return undefined;
            if (value === check(x, 1)) return value;
            if (value === check(x, 2)) return value;
            return undefined;
        }
        /**
         * comprueba si hay un ganador en una columna
         * @param y columna
         * @returns true si hay un ganador en la columna
         */
        const checkCol = (y: number) => {
            const value = check(0, y);
            if (value === undefined) return undefined;
            if (value === check(1, y)) return value;
            if (value === check(2, y)) return value;
            return undefined;
        }
        /**
         * comprueba si hay un ganador en una diagonal
         * @returns true si hay un ganador en la diagonal
         */
        const checkDiag = () => {
            const value = check(0, 0);
            if (value === undefined) return undefined;
            if (value === check(1, 1)) return value;
            if (value === check(2, 2)) return value;
            return undefined;
        }
        /**
         * comprueba si hay un ganador en una diagonal
         * @returns true si hay un ganador en la diagonal
         */
        const checkDiag2 = () => {
            const value = check(0, 2);
            if (value === undefined) return undefined;
            if (value === check(1, 1)) return value;
            if (value === check(2, 0)) return value;
            return undefined;
        }
        // comprueba si hay un ganador en alguna fila, columna o diagonal
        const checkDiagWinner = checkDiag();
        if (checkDiagWinner !== undefined) return [checkDiagWinner, "diagonal", 0];
        const checkDiag2Winner = checkDiag2();
        if (checkDiag2Winner !== undefined) return [checkDiag2Winner, "diagonal", 2];
        for (let i = 0; i < 3; i++) {
            const rowWinner = checkRow(i);
            if (rowWinner !== undefined) return [rowWinner, "row", i];
            const colWinner = checkCol(i);
            if (colWinner !== undefined) return [colWinner, "column", i];
        }
        const diagWinner = checkDiag()
        if (diagWinner !== undefined) return [diagWinner, "diagonal", 0];
        const diag2Winner = checkDiag2();
        if (diag2Winner !== undefined) return [diag2Winner, "diagonal", 2];

        return undefined;
    }
}
