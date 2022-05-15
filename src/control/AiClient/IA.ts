import { ICell } from "../../model/GameBoard";

const ai = require("tictactoe-complex-ai");

interface IConfig {
    /**
     * Nivel de dificultad de la IA
     */
    level: "easy" | "medium" | "hard" | "expert";
    /**
     * Caracter de la IA
     */
    ia?: string,
    /**
     * Caracter del jugador
     */
    player?: string,
    /**
     * Caracter de la casilla vacía 
     */
    empty?: string,
    minResponseTime?: number,
    maxResponseTime?: number
}

interface AI {
    /**
     * Hacer jugada de la IA
     * @param board Tablero de juego, un arreglo de 9 cadenas de texto
     */
    play(board: string[]): Promise<number>;
}
export interface IGameAI {
    play(board: ICell[]): Promise<{x: number, y: number}>;
}
export function createAI(config: IConfig = {level: "expert", minResponseTime: 1000, maxResponseTime:1000}): IGameAI {
    const instance = <AI>ai.createAI(config);
    return {
        async play(board: ICell[]) {
            const array = board.map(cell => ({
                "": "",
                0: "X",
                1: "O"
            })[cell ?? ""]);
            const pos = await instance.play(array);
            const x = pos % 3;
            const y = Math.floor(pos / 3);
            return { x, y };
        }
    }
}