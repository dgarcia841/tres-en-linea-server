/**
 * Obtiene los datos de un error registrado
 * @param error El ID del error a obtener
 * @returns [código del error, texto del error]
 */
export default function GetError(error: IError): [number, string] {
    return [Errors[error].code, Errors[error].error];
}

function ErrorFactory<Errors extends string>
(object: { [e in Errors]: { code: number, error: string } }): { [e in Errors]: { code: number, error: string } } {
    return object;
}
const Errors = ErrorFactory({
    USERNAME_EXISTING: {
        code: 1,
        error: "Ya está en emparejamiento un jugador con el mismo nombre"
    },
    GAME_NOT_FOUND: {
        code: 2,
        error: "No se ha encontrado la partida solicitada"
    },
    PLAYER_NOT_FOUND: {
        code: 3,
        error: "No se ha encontrado el nombre de usuario en la partida"
    },
    GAME_PLAY_ERROR: {
        code: 4,
        error: "No se ha podido realizar la jugada"
    },
});
type IError = keyof typeof Errors;