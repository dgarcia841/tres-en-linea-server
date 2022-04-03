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
    }
});
type IError = keyof typeof Errors;