import Player from "./Player";

export default class Game {
    public readonly players: [Player, Player];
    public readonly id: string;
    constructor(...players: [Player, Player]) {
        this.players = players;
        this.id = Date.now().toString(36);
    }
}