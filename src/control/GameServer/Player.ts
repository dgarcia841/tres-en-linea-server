import { GameServer } from ".";

export default class Player {
    public readonly socket: GameServer.ISocket;
    public readonly username: string;
    constructor(username: string, socket: GameServer.ISocket) {
        this.username = username;
        this.socket = socket;
    }
}