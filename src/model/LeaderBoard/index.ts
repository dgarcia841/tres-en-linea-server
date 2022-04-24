/**
 * Tabla de clasificación de los jugadores
 */
class Leaderboard {

    private static instance: Leaderboard;
    /**
     * Devuelve el leaderboard ordenado por puntaje
     * @returns El objeto leaderboard
     */
    public static get(): Leaderboard {
        if (!Leaderboard.instance) {
            Leaderboard.instance = new Leaderboard();
        }
        return Leaderboard.instance;
    }

    private record: { username: string, score: number }[];
    private constructor() {
        this.record = [];
    }

    /**
     * Añade un nuevo registro al leaderboard
     * @param username El nombre del usuario
     * @param score El puntaje del usuario a sumar
     */
    public add(username: string, score: number): void {
        let element = this.record.find(x => x.username === username);
        if (!element) {
            element = { username, score };
            this.record.push(element);
        }
        else {
            element.score += score;
        }
        // encontrar la posición actual del elemento
        const index = this.record.findIndex(x => x.username === username);
        // encontrar la posición en la que se debe mover el nuevo elemento
        let i = 0; 
        while (i < this.record.length && this.record[i].score > element.score) {
            i++;
        }
        if(index !== -1)
            // borrar elemento de la posición actual
            this.record.splice(index, 1);
        // insertar elemento en la posición correcta
        this.record.splice(i, 0, element);
    }

    /**
     * Obtiene el ranking de los jugadores diez mejores jugadores
     */
    public getTopTen(): { username: string, score: number }[] {
        return this.record.slice(0, 10);
    }
}

export default Leaderboard.get();